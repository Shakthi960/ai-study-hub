import api from './api'

export async function getTopics(chapterId) {
  const res = await api.get(`/chapters/${chapterId}/topics`)
  return res.data
}

export async function createTopic(chapterId, data) {
  const res = await api.post(`/chapters/${chapterId}/topics`, data)
  return res.data
}

export async function updateTopic(topicId, data) {
  const res = await api.put(`/topics/${topicId}`, data)
  return res.data
}

export async function deleteTopic(topicId) {
  const res = await api.delete(`/topics/${topicId}`)
  return res.data
}

export async function reorderTopics(chapterId, topicIds) {
  const res = await api.put(`/chapters/${chapterId}/topics/reorder`, { topic_ids: topicIds })
  return res.data
}
