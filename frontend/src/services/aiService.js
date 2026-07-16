import api from './api'

export async function aiChat(message, chapterId) {
  const res = await api.post('/ai/chat', { message, chapter_id: chapterId })
  return res.data
}

export async function generateQuiz(chapterId, chapterTitle) {
  const res = await api.post('/ai/quiz', { chapter_id: chapterId, chapter_title: chapterTitle })
  return res.data
}

export async function submitQuiz(payload) {
  const res = await api.post('/ai/quiz/submit', payload)
  return res.data
}

export async function getQuizHistory(chapterId) {
  const params = chapterId ? { chapter_id: chapterId } : {}
  const res = await api.get('/ai/quiz/history', { params })
  return res.data
}
