import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { uploadImage } from '../../services/uploadService'

function parseContent(raw) {
  if (!raw) return { body: '', colab_links: [] }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'body' in parsed) {
      const links = parsed.colab_links || []
      if (!links.length && parsed.colab_url) {
        links.push({ label: 'Colab Notebook', url: parsed.colab_url })
      }
      return { body: parsed.body || '', colab_links: links }
    }
  } catch {}
  return { body: raw, colab_links: [] }
}

function packContent(body, colab_links) {
  const filtered = colab_links.filter((l) => l.url.trim())
  if (filtered.length) return JSON.stringify({ body, colab_links: filtered })
  return body
}

export default function MarkdownEditor({ initialContent = '', onSave, isSaving, isReadOnly = false }) {
  const parsed = parseContent(initialContent)
  const [content, setContent] = useState(parsed.body)
  const [colabLinks, setColabLinks] = useState(parsed.colab_links)
  const [isEditing, setIsEditing] = useState(!parsed.body && !isReadOnly)
  const [uploading, setUploading] = useState(false)
  const autoSaveTimer = useRef(null)
  const hasChanges = useRef(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const p = parseContent(initialContent)
    setContent(p.body)
    setColabLinks(p.colab_links)
    hasChanges.current = false
  }, [initialContent])

  const scheduleAutoSave = useCallback(
    (value, links) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        if (hasChanges.current) {
          onSave(packContent(value, links))
          hasChanges.current = false
        }
      }, 2000)
    },
    [onSave]
  )

  const handleContentChange = (e) => {
    setContent(e.target.value)
    hasChanges.current = true
    scheduleAutoSave(e.target.value, colabLinks)
  }

  const handleLinkChange = (index, field, value) => {
    setColabLinks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      hasChanges.current = true
      scheduleAutoSave(content, next)
      return next
    })
  }

  const addLink = () => {
    setColabLinks((prev) => [...prev, { label: '', url: '' }])
  }

  const removeLink = (index) => {
    setColabLinks((prev) => {
      const next = prev.filter((_, i) => i !== index)
      hasChanges.current = true
      scheduleAutoSave(content, next)
      return next
    })
  }

  const handleSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    onSave(packContent(content, colabLinks))
    hasChanges.current = false
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }

  const handleEdit = () => {
    if (isReadOnly) return
    setIsEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const data = await uploadImage(file)
      const markdownImage = `![${file.name}](${data.url})`
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newContent = content.substring(0, start) + markdownImage + content.substring(end)
        setContent(newContent)
        hasChanges.current = true
        scheduleAutoSave(newContent, colabLinks)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + markdownImage.length
          textarea.focus()
        }, 0)
      } else {
        const newContent = content ? content + '\n\n' + markdownImage : markdownImage
        setContent(newContent)
        hasChanges.current = true
        scheduleAutoSave(newContent, colabLinks)
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#3d4249] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Markdown</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700
                         dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? 'Uploading...' : 'Insert Image'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && <span className="text-xs text-gray-400">Saving...</span>}
            {initialContent && (
              <button
                onClick={() => {
                  const p = parseContent(initialContent)
                  setContent(p.body)
                  setColabLinks(p.colab_links)
                  setIsEditing(false)
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary text-sm py-1.5 px-3"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            className="w-full min-h-[300px] p-4 bg-transparent outline-none resize-none
                       text-gray-900 dark:text-gray-100 placeholder-gray-400 font-mono text-sm leading-relaxed"
            placeholder="Start writing your notes in Markdown..."
            autoFocus
          />
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-[#3d4249] shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Colab Notebook Links
            </label>
            <button
              onClick={addLink}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add link
            </button>
          </div>

          {colabLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                value={link.label}
                onChange={(e) => handleLinkChange(i, 'label', e.target.value)}
                className="input-field text-sm w-36 shrink-0"
                placeholder="Label"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => handleLinkChange(i, 'url', e.target.value)}
                className="input-field text-sm flex-1"
                placeholder="https://colab.research.google.com/drive/..."
              />
              <button
                onClick={() => removeLink(i)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50
                           dark:hover:bg-red-900/20 transition-colors shrink-0 mt-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {colabLinks.length === 0 && (
            <p className="text-xs text-gray-400">No links added. Click "Add link" to attach Colab notebooks.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-[#3d4249] shrink-0">
        <span className="text-sm text-gray-500 dark:text-gray-400">Preview</span>
        {!isReadOnly && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {content ? (
          <div className="markdown-body max-w-none p-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="mb-3">No content yet</p>
            <button onClick={handleEdit} className="btn-primary text-sm">
              Start writing
            </button>
          </div>
        )}

        {colabLinks.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#3d4249] space-y-2">
            {colabLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700
                           dark:text-orange-400 dark:hover:text-orange-300 px-4 py-2.5 rounded-lg
                           bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {link.label || 'Open in Colab'}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
