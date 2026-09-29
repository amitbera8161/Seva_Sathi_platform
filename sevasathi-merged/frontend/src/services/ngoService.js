// Mirrors backend/src/controllers/ngo.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

export async function listNGOs({ city, pincode, orgType, verified } = {}) {
  const { data } = await api.get(ENDPOINTS.NGOS.LIST, {
    params: { city, pincode, orgType, verified },
  })
  return data.ngos
}

export async function fetchNGOById(id) {
  const { data } = await api.get(ENDPOINTS.NGOS.DETAIL(id))
  return data.ngo
}

export async function registerNGO(payload) {
  const { data } = await api.post(ENDPOINTS.NGOS.REGISTER, payload)
  return data.ngo
}

export async function fetchMyNGO() {
  const { data } = await api.get(ENDPOINTS.NGOS.ME)
  return data.ngo
}

// ---- Admin-only (requires the 'admin' role — see backend/scripts/grant-admin.js) ----

export async function fetchPendingNGOs() {
  const { data } = await api.get(ENDPOINTS.NGOS.ADMIN_PENDING)
  return data.ngos
}

export async function verifyNGO(id, notes = '') {
  const { data } = await api.post(ENDPOINTS.NGOS.ADMIN_VERIFY(id), { notes })
  return data.ngo
}

export async function rejectNGO(id, notes = '') {
  const { data } = await api.post(ENDPOINTS.NGOS.ADMIN_REJECT(id), { notes })
  return data.ngo
}
