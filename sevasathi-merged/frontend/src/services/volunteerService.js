// Mirrors backend/src/controllers/volunteer.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

export async function searchVolunteers({ cause, skill, city, pincode } = {}) {
  const { data } = await api.get(ENDPOINTS.VOLUNTEERS.SEARCH, {
    params: { cause, skill, city, pincode },
  })
  return data.volunteers
}

export async function registerAsVolunteer(payload) {
  const { data } = await api.post(ENDPOINTS.VOLUNTEERS.REGISTER, payload)
  return data.volunteer
}

export async function fetchMyVolunteerProfile() {
  const { data } = await api.get(ENDPOINTS.VOLUNTEERS.ME)
  return data.volunteer
}
