import { useState, useEffect } from 'react'
import MCQContainer from '../components/MCQContainer'
import StartScreen from '../components/StartScreen'
import ErrorBoundary from '../components/ErrorBoundary'
import { getActiveQuestionFile, loadSubmissions } from '../utils/api'

function ExamPage() {
  const [studentName, setStudentName] = useState(() => {
    // Check localStorage for saved session
    const savedName = localStorage.getItem('exam_session_student')
    const savedSession = savedName ? localStorage.getItem(`mcq_state_v100_${savedName}`) : null
    return savedSession ? savedName : ''
  })
  const [questions, setQuestions] = useState([])
  const [questionFile, setQuestionFile] = useState('questions.json')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // WK-6: track if student already submitted (block re-submission)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  async function loadQuestions() {
    try {
      // Get the active question file from config
      const activeConfig = await getActiveQuestionFile()
      const file = activeConfig.activeFile || 'questions.json'

      setQuestionFile(file)

      // Add cache buster to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`
      const fileUrl = `/${file}${cacheBuster}`

      const res = await fetch(fileUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })

      if (!res.ok) {
        throw new Error(`Failed to load questions: ${res.status} ${res.statusText}`)
      }

      // Check if response is actually JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`File ${file} is not a JSON file. Got content-type: ${contentType}`)
      }

      const data = await res.json()

      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No questions found in file')
      }

      // Transform questions to match expected format
      const transformed = data.map(q => ({
        id: q.id,
        question: q.question,
        options: Object.entries(q.options).map(([id, text]) => ({ id, text })),
        correctOptionId: q.correctAnswer,
        explanation: q.explanation || `সঠিক উত্তর: ${q.correctAnswer}. ${q.question}`,
        hasDiagram: q.hasDiagram || false,
        svg_code: q.svg_code || null,
        subject: q.subject || ''
      }))

      if (transformed.length === 0) {
        throw new Error('No valid questions found after processing')
      }

      setQuestions(transformed)
      setLoading(false)
    } catch (err) {
      console.error('Error loading questions:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="bengali">প্রশ্ন লোড হচ্ছে...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--error)', fontSize: '18px' }} className="bengali">
          প্রশ্ন লোড করতে সমস্যা হয়েছে
        </div>
        <div style={{ color: 'var(--gray-600)', fontSize: '14px', marginTop: '8px' }}>
          {error}
        </div>
        <button
          onClick={loadQuestions}
          style={{
            padding: '12px 24px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '16px'
          }}
          className="bengali"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    )
  }

  // WK-6: Check if student already has a submission before allowing exam start
  async function handleStudentStart(name) {
    try {
      const submissions = await loadSubmissions()
      const existing = submissions.find(s => s.studentName === name)
      if (existing) {
        setAlreadySubmitted(true)
        setStudentName(name)   // needed to show the block screen with the name
        return
      }
    } catch (e) {
      // If we can't check, allow them in (fail open - better UX than blocking everyone)
      console.warn('Could not verify submission status:', e.message)
    }
    localStorage.setItem('exam_session_student', name)
    setStudentName(name)
  }

  if (alreadySubmitted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--gray-50)', padding: '20px' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛔</div>
          <h2 className="bengali" style={{ color: 'var(--error)', marginBottom: '12px' }}>আপনি আগেই পরীক্ষা দিয়েছেন</h2>
          <p className="bengali" style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
            <strong>{studentName}</strong> নামে একটি submission আগেই সার্ভারে বিদ্যমান আছে। পুনরায় পরীক্ষা দেওয়া যাবে না।
          </p>
          <p className="bengali" style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '16px' }}>
            যদি ভুল হয়ে থাকে, আপনার শিক্ষককে জানান।
          </p>
        </div>
      </div>
    )
  }

  if (!studentName) {
    return <StartScreen onStart={handleStudentStart} />
  }

  return (
    <ErrorBoundary>
      <MCQContainer questions={questions} studentName={studentName} questionFile={questionFile} />
    </ErrorBoundary>
  )
}

export default ExamPage


