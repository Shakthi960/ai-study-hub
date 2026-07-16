import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function Quiz({ questions, onSubmit, onClose }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (submitted && scrollRef.current) {
      const container = scrollRef.current.closest('.overflow-y-auto')
      if (container) container.scrollTop = 0
    }
  }, [submitted])

  const question = questions[currentQ]

  const handleAnswer = (optionIndex) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [currentQ]: optionIndex }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await onSubmit(answers)
      setResult(res)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const getOptionStyle = (optionIndex) => {
    if (!submitted) {
      return answers[currentQ] === optionIndex
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
    }

    if (optionIndex === question.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    }
    if (answers[currentQ] === optionIndex && optionIndex !== question.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    }
    return 'border-gray-200 dark:border-gray-600 opacity-50'
  }

  if (submitted && result) {
    const percentage = Math.round((result.score / result.total_questions) * 100)
    return (
      <div ref={scrollRef} className="space-y-6">
        <div className="text-center py-6">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              percentage >= 70
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            <span
              className={`text-2xl font-bold ${
                percentage >= 70 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {percentage}%
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {result.score} / {result.total_questions}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {percentage >= 70 ? 'Great job!' : 'Keep studying!'}
          </p>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = result.answers_data?.[i]
            const isCorrect = parseInt(userAnswer) === q.correct_answer
            return (
              <div key={i} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown>
                  </p>
                </div>
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`ml-7 px-3 py-1.5 rounded text-sm mb-1 border ${
                      j === q.correct_answer
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : parseInt(userAnswer) === j
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-transparent'
                    }`}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
                <div className="ml-7 mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  {q.explanation}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700
                       dark:text-orange-400 dark:hover:text-orange-300 px-3 py-2 rounded-lg
                       hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Practice in Colab
          </a>
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Question {currentQ + 1} of {questions.length}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Object.keys(answers).length} answered
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.question}</ReactMarkdown>
        </h4>

        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-200 ${getOptionStyle(i)}`}
            >
              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="btn-secondary disabled:opacity-30"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((p) => p + 1)}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
