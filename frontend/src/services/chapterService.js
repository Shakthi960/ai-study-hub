import api from './api'

export async function getChapters(query) {
  const params = query ? { q: query } : {}
  const res = await api.get('/chapters', { params })
  return res.data
}

export async function getChapter(id) {
  const res = await api.get(`/chapters/${id}`)
  return res.data
}

export async function createChapter(data) {
  const res = await api.post('/chapters', data)
  return res.data
}

export async function updateChapter(id, data) {
  const res = await api.put(`/chapters/${id}`, data)
  return res.data
}

export async function deleteChapter(id) {
  const res = await api.delete(`/chapters/${id}`)
  return res.data
}

export async function toggleChapterPublic(id) {
  const res = await api.put(`/chapters/${id}/toggle-public`)
  return res.data
}

export async function getPublicChapters() {
  const res = await api.get('/chapters/public')
  return res.data
}

export async function getPublicChapter(id) {
  const res = await api.get(`/chapters/public/${id}`)
  return res.data
}
