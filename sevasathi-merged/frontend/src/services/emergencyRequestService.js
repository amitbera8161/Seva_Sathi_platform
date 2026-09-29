// Mirrors backend/src/controllers/emergencyrequest.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public — no auth required (backend uses optionalAuth on the list route)
export async function listEmergencyRequests({ status, category, severity, city, pincode } = {}) {
  const { data } = await api.get(ENDPOINTS.EMERGENCY_REQUESTS.LIST, {
    params: { status, category, severity, city, pincode },
  })
  return data.requests
}

export async function createEmergencyRequest(payload) {
  const { data } = await api.post(ENDPOINTS.EMERGENCY_REQUESTS.CREATE, payload)
  return data.request
}

export async function offerHelp(id) {
  const { data } = await api.post(ENDPOINTS.EMERGENCY_REQUESTS.HELP(id))
  return data.request
}

export async function withdrawHelp(id) {
  const { data } = await api.delete(ENDPOINTS.EMERGENCY_REQUESTS.HELP(id))
  return data.request
}

export async function resolveRequest(id) {
  const { data } = await api.patch(ENDPOINTS.EMERGENCY_REQUESTS.RESOLVE(id))
  return data.request
}

export async function deleteEmergencyRequest(id) {
  const { data } = await api.delete(ENDPOINTS.EMERGENCY_REQUESTS.DELETE(id))
  return data
}
