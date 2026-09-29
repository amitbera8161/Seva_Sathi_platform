// Mirrors backend/src/controllers/resource.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public — no auth required (backend uses optionalAuth on the list route)
export async function listResources({ category, city, pincode, availableOnly } = {}) {
  const { data } = await api.get(ENDPOINTS.RESOURCES.LIST, {
    params: { category, city, pincode, availableOnly },
  })
  return data.resources
}

export async function createResource(payload) {
  const { data } = await api.post(ENDPOINTS.RESOURCES.CREATE, payload)
  return data.resource
}

export async function requestResource(id, message = '') {
  const { data } = await api.post(ENDPOINTS.RESOURCES.REQUEST(id), { message })
  return data.resource
}

export async function updateResourceAvailability(id, isAvailable) {
  const { data } = await api.patch(ENDPOINTS.RESOURCES.AVAILABILITY(id), { isAvailable })
  return data.resource
}

export async function deleteResource(id) {
  const { data } = await api.delete(ENDPOINTS.RESOURCES.DELETE(id))
  return data
}
