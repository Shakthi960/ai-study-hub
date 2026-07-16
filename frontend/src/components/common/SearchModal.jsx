import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getChapters } from '../../services/chapterService'

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const { data: chapters } = useQuery({
    queryKey: ['chapters', query],
    queryFn: () => getChapters(query || undefined),
    enabled: query.length >= 1,
  })

  const handleSelect = (chapter) => {
    onClose()
    navigate(`/chapter/${chapter.id}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.length >= 1 && chapters?.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
          {chapters?.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => handleSelect(chapter)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <p className="font-medium text-gray-900 dark:text-white">{chapter.title}</p>
              {chapter.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {chapter.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">{chapter.topic_count} topics</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
