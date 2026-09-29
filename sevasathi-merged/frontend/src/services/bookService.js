// Mirrors backend/src/controllers/book.controller.js and
// backend/src/controllers/bookrequest.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// ---------- Book listings ----------

// Public — no auth required (backend uses optionalAuth on search/detail)
export async function searchBooks({ q, category, language, condition, city, pincode, availableOnly } = {}) {
  const { data } = await api.get(ENDPOINTS.BOOKS.SEARCH, {
    params: { q, category, language, condition, city, pincode, availableOnly },
  })
  return data.books
}

export async function fetchBookById(id) {
  const { data } = await api.get(ENDPOINTS.BOOKS.DETAIL(id))
  return data.book
}

export async function donateBook(payload) {
  const { data } = await api.post(ENDPOINTS.BOOKS.DONATE, payload)
  return data.book
}

// Donor's own listings
export async function fetchMyBooks() {
  const { data } = await api.get(ENDPOINTS.BOOKS.MINE)
  return data.books
}

export async function updateBook(id, payload) {
  const { data } = await api.patch(ENDPOINTS.BOOKS.UPDATE(id), payload)
  return data.book
}

export async function setBookAvailability(id, isActive) {
  const { data } = await api.patch(ENDPOINTS.BOOKS.AVAILABILITY(id), { isActive })
  return data.book
}

// ---------- Requests ----------

export async function requestBook(bookId, { quantity = 1, message = '' } = {}) {
  const { data } = await api.post(ENDPOINTS.BOOKS.REQUEST(bookId), { quantity, message })
  return data.request
}

// Beneficiary's own request history
export async function fetchMyBookRequests() {
  const { data } = await api.get(ENDPOINTS.BOOK_REQUESTS.MINE)
  return data.requests
}

// Requests made against books this user has donated
export async function fetchIncomingBookRequests() {
  const { data } = await api.get(ENDPOINTS.BOOK_REQUESTS.INCOMING)
  return data.requests
}

// Platform-wide oversight (Volunteer/NGO/Admin)
export async function listAllBookRequests({ status } = {}) {
  const { data } = await api.get(ENDPOINTS.BOOK_REQUESTS.LIST, { params: { status } })
  return data.requests
}

export async function approveBookRequest(id, note = '') {
  const { data } = await api.patch(ENDPOINTS.BOOK_REQUESTS.APPROVE(id), { note })
  return data.request
}

export async function rejectBookRequest(id, note = '') {
  const { data } = await api.patch(ENDPOINTS.BOOK_REQUESTS.REJECT(id), { note })
  return data.request
}

export async function collectBookRequest(id) {
  const { data } = await api.patch(ENDPOINTS.BOOK_REQUESTS.COLLECT(id))
  return data.request
}

export async function completeBookRequest(id) {
  const { data } = await api.patch(ENDPOINTS.BOOK_REQUESTS.COMPLETE(id))
  return data.request
}

export async function cancelBookRequest(id, reason = '') {
  const { data } = await api.patch(ENDPOINTS.BOOK_REQUESTS.CANCEL(id), { reason })
  return data.request
}
