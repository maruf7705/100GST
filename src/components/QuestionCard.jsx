import { useState } from 'react'
import { useSwipe } from '../hooks/useSwipe'
import { renderLatex } from '../utils/latex'
import './QuestionCard.css'

function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  onSubmit
}) {
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const swipeHandlers = useSwipe(
    () => canGoNext && onNext(),
    () => canGoPrev && onPrev()
  )

  if (!question) return null

  return (
    <div
      className="question-card"
      {...swipeHandlers}
    >
      <div className="question-header">
        <span className="question-badge bengali">প্রশ্ন {questionNumber}</span>
      </div>

      <div className="question-text bengali" dangerouslySetInnerHTML={{ __html: renderLatex(question.question) }} />

      {question.hasDiagram && question.svg_code && (
        <div className="question-diagram" dangerouslySetInnerHTML={{ __html: question.svg_code }} />
      )}

      <div className="options-grid">
        {question.options.map((option) => {
          const isSelected = selectedAnswer === option.id
          return (
            <button
              key={option.id}
              className={`option - card ${isSelected ? 'selected' : ''} `}
              onClick={() => onAnswerSelect(question.id, option.id)}
            >
              <span className="option-label">{option.id})</span>
              <span className="option-text bengali" dangerouslySetInnerHTML={{ __html: renderLatex(option.text) }} />
              {isSelected && <span className="check-icon">✓</span>}
            </button>
          )
        })}
      </div>

      <div className="question-actions">
        {/* Exit Button — replaces Review */}
        <button
          className="action-btn exit-btn"
          onClick={() => setShowExitConfirm(true)}
        >
          <span className="bengali">✕ বের হন</span>
        </button>

        <div className="nav-buttons">
          <button
            className="action-btn"
            onClick={onPrev}
            disabled={!canGoPrev}
          >
            ← <span className="bengali">পূর্বের</span>
          </button>
          {canGoNext ? (
            <button
              className="action-btn primary"
              onClick={onNext}
            >
              <span className="bengali">পরের</span> →
            </button>
          ) : (
            <button
              className="action-btn primary submit-btn"
              onClick={onSubmit}
            >
              <span className="bengali">সাবমিট</span>
            </button>
          )}
        </div>
      </div>

      {/* Exit Confirm Popup */}
      {showExitConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px 24px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h3 className="bengali" style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              পরীক্ষা থেকে বের হবেন?
            </h3>
            <p className="bengali" style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              আপনি যতটুকু উত্তর দিয়েছেন সেটা সাবমিট হয়ে যাবে।<br />এরপর আর পরিবর্তন করা যাবে না।
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="bengali"
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                  background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer'
                }}
                onClick={() => {
                  setShowExitConfirm(false)
                  onSubmit()
                }}
              >
                হ্যাঁ, বের হই
              </button>
              <button
                className="bengali"
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1.5px solid #e2e8f0', background: 'white',
                  color: '#374151', fontWeight: 600, fontSize: '15px', cursor: 'pointer'
                }}
                onClick={() => setShowExitConfirm(false)}
              >
                না, থাকি
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
