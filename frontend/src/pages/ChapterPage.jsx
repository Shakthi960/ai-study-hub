import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getChapter, updateChapter, deleteChapter, toggleChapterPublic } from '../services/chapterService'
import { getTopics, createTopic, updateTopic, deleteTopic, reorderTopics } from '../services/topicService'
import { getContent, saveContent } from '../services/contentService'
import { generateQuiz, submitQuiz } from '../services/aiService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import MarkdownEditor from '../components/chapter/MarkdownEditor'
import Quiz from '../components/quiz/Quiz'

export default function ChapterPage() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTopicId, setActiveTopicId] = useState(null)
  const [showEditChapter, setShowEditChapter] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [renamingTopicId, setRenamingTopicId] = useState(null)
  const [renameTitle, setRenameTitle] = useState('')
  const tabsRef = useRef(null)
  const prevChapterIdRef = useRef(chapterId)

  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', chapterId],
    queryFn: () => getChapter(chapterId),
    enabled: !!chapterId,
  })

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', chapterId],
    queryFn: () => getTopics(chapterId),
    enabled: !!chapterId,
  })

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['content', activeTopicId],
    queryFn: () => getContent(activeTopicId),
    enabled: !!activeTopicId,
  })

  useEffect(() => {
    if (chapterId !== prevChapterIdRef.current) {
      prevChapterIdRef.current = chapterId
      setActiveTopicId(null)
    }
  }, [chapterId])

  useEffect(() => {
    if (topics?.length && !activeTopicId) {
      setActiveTopicId(topics[0].id)
    }
  }, [topics, activeTopicId])

  const updateChapterMut = useMutation({
    mutationFn: (data) => updateChapter(chapterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      setShowEditChapter(false)
      toast.success('Chapter updated')
    },
    onError: () => toast.error('Failed to update chapter'),
  })

  const deleteChapterMut = useMutation({
    mutationFn: () => deleteChapter(chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      toast.success('Chapter deleted')
      navigate('/')
    },
    onError: () => toast.error('Failed to delete chapter'),
  })

  const togglePublicMut = useMutation({
    mutationFn: () => toggleChapterPublic(chapterId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
      queryClient.invalidateQueries({ queryKey: ['publicChapters'] })
      toast.success(data.is_public ? 'Chapter is now public' : 'Chapter is now private')
    },
    onError: () => toast.error('Failed to update visibility'),
  })

  const createTopicMut = useMutation({
    mutationFn: (data) => createTopic(chapterId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['topics', chapterId] })
      setShowAddTopic(false)
      setNewTopicTitle('')
      setActiveTopicId(data.id)
      toast.success('Topic added')
    },
    onError: () => toast.error('Failed to add topic'),
  })

  const updateTopicMut = useMutation({
    mutationFn: ({ topicId, data }) => updateTopic(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', chapterId] })
      setRenamingTopicId(null)
      toast.success('Topic renamed')
    },
    onError: () => toast.error('Failed to rename topic'),
  })

  const deleteTopicMut = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics', chapterId] })
      toast.success('Topic deleted')
    },
    onError: () => toast.error('Failed to delete topic'),
  })

  const saveContentMut = useMutation({
    mutationFn: ({ topicId, data }) => saveContent(topicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', activeTopicId] })
      toast.success('Saved', { icon: '✓' })
    },
    onError: () => toast.error('Failed to save'),
  })

  const handleSaveContent = useCallback(
    (body) => {
      if (!activeTopicId) return
      saveContentMut.mutate({ topicId: activeTopicId, data: { body } })
    },
    [activeTopicId, saveContentMut]
  )

  const handleStartQuiz = async () => {
    setQuizLoading(true)
    setShowQuiz(true)
    try {
      const data = await generateQuiz(chapterId, chapter?.title)
      setQuizQuestions(data.questions)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate quiz')
      setShowQuiz(false)
    } finally {
      setQuizLoading(false)
    }
  }

  const handleSubmitQuiz = async (answers) => {
    try {
      const result = await submitQuiz({
        chapter_id: parseInt(chapterId),
        chapter_title: chapter?.title,
        questions: quizQuestions,
        answers,
      })
      return result
    } catch (err) {
      toast.error('Failed to submit quiz')
      throw err
    }
  }

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction * 200, behavior: 'smooth' })
    }
  }

  const currentTopicIndex = topics?.findIndex((t) => t.id === activeTopicId) ?? -1
  const prevTopic = currentTopicIndex > 0 ? topics[currentTopicIndex - 1] : null
  const nextTopic = currentTopicIndex < (topics?.length - 1) ? topics[currentTopicIndex + 1] : null

  const handleEditChapter = () => {
    setEditTitle(chapter?.title || '')
    setEditDesc(chapter?.description || '')
    setShowEditChapter(true)
  }

  if (chapterLoading) return <LoadingSpinner />

  if (!chapter) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chapter not found</h2>
        <Link to="/" className="text-primary-600 hover:underline mt-2 inline-block">Go home</Link>
      </div>
    )
  }

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium truncate">{chapter.title}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {chapter.title}
          </h1>
          {chapter.description && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{chapter.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleStartQuiz} disabled={quizLoading} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {quizLoading ? 'Generating...' : 'Quiz'}
          </button>
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Practice in Colab
          </a>
          {chapter.is_owner && (
            <>
              <button
                onClick={() => togglePublicMut.mutate()}
                disabled={togglePublicMut.isPending}
                className={`btn-secondary flex items-center gap-2 text-sm ${chapter.is_public ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {chapter.is_public ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  )}
                </svg>
                {chapter.is_public ? 'Public' : 'Publish'}
              </button>
              <button onClick={handleEditChapter} className="btn-secondary text-sm">Edit</button>
              <button
                onClick={() => {
                  if (confirm('Delete this chapter and all its topics?')) {
                    deleteChapterMut.mutate()
                  }
                }}
                className="btn-secondary text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="relative mb-6">
        <button
          onClick={() => scrollTabs(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-[#30343f]
                     shadow-md rounded-full hover:bg-gray-50 dark:hover:bg-[#3d4249] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-8 pb-2" style={{ scrollbarWidth: 'none' }}>
          {topicsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-[#3d4249] rounded-lg animate-pulse shrink-0" />
            ))
          ) : (
            topics?.map((topic) => (
              <div
                key={topic.id}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium shrink-0
                           cursor-pointer transition-all duration-200
                           ${topic.id === activeTopicId
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-[#30343f] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3d4249]'
                  }`}
                onClick={() => setActiveTopicId(topic.id)}
              >
                {renamingTopicId === topic.id ? (
                  <input
                    type="text"
                    value={renameTitle}
                    onChange={(e) => setRenameTitle(e.target.value)}
                    onBlur={() => {
                      if (renameTitle.trim()) {
                        updateTopicMut.mutate({ topicId: topic.id, data: { title: renameTitle.trim() } })
                      }
                      setRenamingTopicId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur()
                      if (e.key === 'Escape') setRenamingTopicId(null)
                    }}
                    className="bg-white dark:bg-[#30343f] text-gray-900 dark:text-white px-2 py-0.5 rounded
                               border border-primary-500 outline-none w-32 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setRenamingTopicId(topic.id)
                      setRenameTitle(topic.title)
                    }}
                    className="truncate max-w-[120px]"
                  >
                    {topic.title}
                  </span>
                )}
                {chapter.is_owner && topics.length > 1 && renamingTopicId !== topic.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete topic "${topic.title}"?`)) {
                        deleteTopicMut.mutate(topic.id)
                        if (topic.id === activeTopicId) {
                          const remaining = topics.filter((t) => t.id !== topic.id)
                          setActiveTopicId(remaining[0]?.id || null)
                        }
                      }
                    }}
                    className="p-0.5 rounded hover:bg-white/20 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}

          {chapter.is_owner && (
            <button
              onClick={() => setShowAddTopic(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium shrink-0
                         bg-gray-100 dark:bg-[#30343f] text-gray-500 dark:text-gray-400
                         hover:bg-gray-200 dark:hover:bg-[#3d4249] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => scrollTabs(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white dark:bg-[#30343f]
                     shadow-md rounded-full hover:bg-gray-50 dark:hover:bg-[#3d4249] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="bg-white dark:bg-[#30343f] rounded-xl border border-gray-200 dark:border-[#3d4249] min-h-[500px]">
        {contentLoading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : activeTopicId ? (
          <MarkdownEditor
            key={activeTopicId}
            initialContent={content?.body || ''}
            onSave={chapter.is_owner ? handleSaveContent : null}
            isSaving={saveContentMut.isPending}
            isReadOnly={!chapter.is_owner}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
            <p>No topics yet. Add one to start writing.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => prevTopic && setActiveTopicId(prevTopic.id)}
          disabled={!prevTopic}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentTopicIndex + 1} / {topics?.length || 0}
        </span>
        <button
          onClick={() => nextTopic && setActiveTopicId(nextTopic.id)}
          disabled={!nextTopic}
          className="btn-secondary flex items-center gap-2 disabled:opacity-30"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <Modal isOpen={showEditChapter} onClose={() => setShowEditChapter(false)} title="Edit Chapter">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateChapterMut.mutate({ title: editTitle.trim(), description: editDesc.trim() })
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="input-field resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowEditChapter(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!editTitle.trim()} className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddTopic} onClose={() => setShowAddTopic(false)} title="Add Topic">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (newTopicTitle.trim()) {
              createTopicMut.mutate({ title: newTopicTitle.trim() })
            }
          }}
        >
          <input
            type="text"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            className="input-field"
            placeholder="Topic title"
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowAddTopic(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={!newTopicTitle.trim()} className="btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      {showQuiz && (
        <Modal isOpen={showQuiz} onClose={() => {}} title="Quiz" maxWidth="max-w-2xl" preventClose>
          {quizLoading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : quizQuestions ? (
            <Quiz
              questions={quizQuestions}
              onSubmit={handleSubmitQuiz}
              onClose={() => { setShowQuiz(false); setQuizQuestions(null) }}
            />
          ) : null}
        </Modal>
      )}
    </div>
  )
}
