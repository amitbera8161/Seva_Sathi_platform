// Mirrors backend/src/controllers/post.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public — no auth required (backend uses optionalAuth on the list route)
export async function listPosts({ type, city, page, limit } = {}) {
  const { data } = await api.get(ENDPOINTS.POSTS.LIST, {
    params: { type, city, page, limit },
  })
  return data.posts
}

export async function createPost(payload) {
  const { data } = await api.post(ENDPOINTS.POSTS.CREATE, payload)
  return data.post
}

export async function togglePostLike(id) {
  const { data } = await api.post(ENDPOINTS.POSTS.LIKE(id))
  return data // { liked, post }
}

export async function addPostComment(id, text) {
  const { data } = await api.post(ENDPOINTS.POSTS.COMMENT(id), { text })
  return data.post
}
