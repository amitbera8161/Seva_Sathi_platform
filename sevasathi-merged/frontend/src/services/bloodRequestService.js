// Mirrors backend/src/controllers/bloodrequest.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public — no auth required (backend uses optionalAuth on list/detail)
export async function listBloodRequests({ status, bloodGroup, city, pincode } = {}) {
  const { data } = await api.get(ENDPOINTS.BLOOD_REQUESTS.LIST, {
    params: { status, bloodGroup, city, pincode },
  })
  return data.requests
}

export async function fetchBloodRequestById(id) {
  const { data } = await api.get(ENDPOINTS.BLOOD_REQUESTS.DETAIL(id))
  return data.request
}

export async function createBloodRequest(payload) {
  const { data } = await api.post(ENDPOINTS.BLOOD_REQUESTS.CREATE, payload)
  return data.request
}

// Patient's own request history
export async function fetchMyBloodRequests() {
  const { data } = await api.get(ENDPOINTS.BLOOD_REQUESTS.MINE)
  return data.requests
}

// Requests where the current user was matched as a donor
export async function fetchMyDonorMatches() {
  const { data } = await api.get(ENDPOINTS.BLOOD_REQUESTS.DONOR_MATCHES)
  return data.requests
}

export async function respondToBloodRequest(id, response, eta = '') {
  const { data } = await api.post(ENDPOINTS.BLOOD_REQUESTS.DONOR_RESPONSE(id), { response, eta })
  return data.request
}

export async function rematchBloodRequest(id) {
  const { data } = await api.post(ENDPOINTS.BLOOD_REQUESTS.REMATCH(id))
  return data.request
}

// Either side calls this once the donation actually happened. First call
// moves the request to "waiting_confirmation"; the matching call from the
// other side moves it to "completed". No NGO/admin approval involved.
export async function confirmBloodDonation(id) {
  const { data } = await api.post(ENDPOINTS.BLOOD_REQUESTS.CONFIRM(id))
  return data.request
}

export async function cancelBloodRequest(id, reason = '') {
  const { data } = await api.patch(ENDPOINTS.BLOOD_REQUESTS.CANCEL(id), { reason })
  return data.request
}
