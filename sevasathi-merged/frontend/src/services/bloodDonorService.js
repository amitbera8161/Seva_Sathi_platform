// Mirrors backend/src/controllers/blooddonor.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public search — no auth required (backend uses optionalAuth on /search)
export async function searchBloodDonors({ bloodGroup, city, pincode } = {}) {
  const { data } = await api.get(ENDPOINTS.BLOOD_DONORS.SEARCH, {
    params: { bloodGroup, city, pincode },
  })
  return data.donors
}

// Requires the user to already have the 'blood_donor' role (see authService.addRole)
export async function registerAsBloodDonor(payload) {
  const { data } = await api.post(ENDPOINTS.BLOOD_DONORS.REGISTER, payload)
  return data.donor
}

export async function fetchMyBloodDonorProfile() {
  const { data } = await api.get(ENDPOINTS.BLOOD_DONORS.ME)
  return data.donor
}

// Editable fields only: bloodGroup, availableForEmergency, city, pincode
// (see backend/src/services/blooddonor.service.js#updateDonorProfile)
export async function updateMyBloodDonorProfile(payload) {
  const { data } = await api.patch(ENDPOINTS.BLOOD_DONORS.ME, payload)
  return data.donor
}

// Lets a donor log a donation manually (e.g. one given at an off-platform
// camp) — separate from the automatic bookkeeping that happens when a
// BloodRequest they were matched to completes.
export async function recordBloodDonation(donationDate) {
  const { data } = await api.post(ENDPOINTS.BLOOD_DONORS.RECORD_DONATION, { donationDate })
  return data.donor
}

// ---- Admin-only (requires the 'admin' role — see backend/scripts/grant-admin.js) ----

export async function fetchPendingDonorVerifications() {
  const { data } = await api.get(ENDPOINTS.BLOOD_DONORS.ADMIN_PENDING)
  return data.donors
}

export async function verifyBloodDonor(id) {
  const { data } = await api.post(ENDPOINTS.BLOOD_DONORS.ADMIN_VERIFY(id))
  return data.donor
}
