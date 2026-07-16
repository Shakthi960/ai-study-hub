import api from './api'

export async function getContent(topicId) {
  const res = await api.get(`/topics/${topicId}/content`)
  return res.data
}

export async function saveContent(topicId, data) {
  const res = await api.put(`/topics/${topicId}/content`, data)
  return res.data
}
