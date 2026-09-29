// Centralized axios instance for all API calls.
// Every service in src/services should import `api` from here
// instead of creating its own axios instance.
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // send the httpOnly refreshToken cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// Separate, interceptor-free instance for the refresh call itself —
// using `api` here would recurse back into this same 401 handler.
const refreshClient = axios.create({ baseURL: BASE_URL, withCredentials: true })

// Attach auth token (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sevasathi_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function fullLogout() {
  localStorage.removeItem('sevasathi_user')
  localStorage.removeItem('sevasathi_token')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

// Handle common error cases centrally (e.g. expired session).
// On a 401, try once to refresh the access token using the httpOnly
// refresh cookie before giving up — this is what was missing before:
// previously a 401 just deleted the token and left the UI thinking it
// was still logged in, so every next request failed with a raw
// "Access token not found" message shown straight to the user.
let refreshPromise = null

// Auth endpoints return 401 for their own reasons (bad password, expired
// refresh cookie, etc.) — those must reach the caller as-is, not trigger
// a refresh attempt.
const AUTH_PATHS_EXCLUDED_FROM_REFRESH = ['/auth/login', '/auth/refresh-token', '/auth/signup', '/auth/verify-otp']

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isExcludedAuthCall = AUTH_PATHS_EXCLUDED_FROM_REFRESH.some((p) => config?.url?.includes(p))

    if (response?.status !== 401 || config._retried || isExcludedAuthCall) {
      return Promise.reject(error)
    }
    config._retried = true

    try {
      // De-dupe concurrent 401s into a single refresh call
      refreshPromise = refreshPromise || refreshClient.post('/auth/refresh-token')
      const { data } = await refreshPromise
      refreshPromise = null

      localStorage.setItem('sevasathi_token', data.accessToken)
      config.headers.Authorization = `Bearer ${data.accessToken}`
      return api(config)
    } catch (refreshErr) {
      refreshPromise = null
      fullLogout()
      return Promise.reject(refreshErr)
    }
  }
)

export default api
