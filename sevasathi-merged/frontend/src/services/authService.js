// Business-logic layer for authentication.
// Pages/components call these functions instead of talking to axios directly.
// Mirrors backend/src/controllers/auth.controller.js and user.controller.js.
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Step 1 of registration. Backend does NOT log the user in yet — it sends
// an OTP and expects verifyAccountOtp() before login is allowed.
export async function registerUser({ fullName, email, phone, password }) {
  const { data } = await api.post(ENDPOINTS.AUTH.SIGNUP, { fullName, email, phone, password })
  return data // { message, user }
}

export async function verifyAccountOtp({ userId, otp, purpose = 'email_verification' }) {
  const { data } = await api.post(ENDPOINTS.AUTH.VERIFY_OTP, { userId, otp, purpose })
  return data // { message, user }
}

export async function resendAccountOtp({ userId, purpose = 'email_verification' }) {
  const { data } = await api.post(ENDPOINTS.AUTH.RESEND_OTP, { userId, purpose })
  return data // { message }
}

// identifier = email or phone (backend looks up either)
export async function loginUser(identifier, password) {
  const { data } = await api.post(ENDPOINTS.AUTH.LOGIN, { identifier, password })
  return data // { message, user, accessToken }
}

export async function fetchCurrentUser() {
  const { data } = await api.get(ENDPOINTS.USERS.ME)
  return data.user
}

// Backend only persists fullName, city, pincode, avatarUrl (see
// backend/src/services/user.service.js#updateProfile) — email/phone are
// identity fields set at signup and aren't editable here.
export async function updateMyProfile({ fullName, city, pincode, avatarUrl } = {}) {
  const { data } = await api.patch(ENDPOINTS.USERS.ME, { fullName, city, pincode, avatarUrl })
  return data.user
}

// Adds a role (e.g. 'blood_donor', 'volunteer', 'ngo') to the logged-in user.
// Must be called with a valid access token already attached (see axiosClient).
export async function addRole(role) {
  const { data } = await api.post(ENDPOINTS.USERS.ADD_ROLE, { role })
  return data // { message, user }
}

export async function logoutUser() {
  try {
    await api.post(ENDPOINTS.AUTH.LOGOUT)
  } catch {
    // Ignore network/session errors on logout — we clear local state regardless.
  } finally {
    localStorage.removeItem('sevasathi_user')
    localStorage.removeItem('sevasathi_token')
  }
}
