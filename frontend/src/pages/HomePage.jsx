import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getChapters, createChapter, deleteChapter, getPublicChapters } from '../services/chapterService'
import { ChapterCardSkeleton } from '../components/common/Skeleton'
import Modal from '../components/common/Modal'

export default function HomePage() {
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: chapters, isLoading } = useQuery({
    queryKey: ['chapters'],
    queryFn: getChapters,
  })

  const { data: publicChapters, isLoading: publicLoading } = useQuery({
    queryKey: ['publicChapters'],
    queryFn: getPublicChapters,
  })

  const createMutation = useMutation({
    mutationFn: createChapter,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      setShowCreate(false)
      setTitle('')
      setDescription('')
      toast.success('Chapter created')
      navigate(`/chapter/${data.id}`)
    },
    onError: () => toast.error('Failed to create chapter'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteChapter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success('Chapter deleted')
    },
    onError: () => toast.error('Failed to delete chapter'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    createMutation.mutate({ title: title.trim(), description: description.trim() || undefined })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Chapters
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {chapters?.length || 0} chapter{(chapters?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Create Chapter</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <ChapterCardSkeleton key={i} />)}
        </div>
      ) : chapters?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No chapters yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first chapter to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create Chapter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="card group cursor-pointer relative" onClick={() => navigate(`/chapter/${chapter.id}`)}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 pr-8 truncate">
                {chapter.title}
                {chapter.is_public && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Public
                  </span>
                )}
              </h3>
              {chapter.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {chapter.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{chapter.topic_count} topic{chapter.topic_count !== 1 ? 's' : ''}</span>
                <span>Updated {formatDate(chapter.updated_at)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this chapter?')) {
                    deleteMutation.mutate(chapter.id)
                  }
                }}
                className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity
                           text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {publicChapters?.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Public Library
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Chapters shared by the community
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicChapters.map((chapter) => (
              <div
                key={chapter.id}
                className="card group cursor-pointer relative border-green-200 dark:border-green-800/50"
                onClick={() => navigate(`/chapter/${chapter.id}`)}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                    {chapter.title}
                  </h3>
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Public
                  </span>
                </div>
                {chapter.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {chapter.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{chapter.topic_count} topic{chapter.topic_count !== 1 ? 's' : ''}</span>
                  <span>Updated {formatDate(chapter.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Chapter">
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. Introduction to Python"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Brief description of this chapter..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
