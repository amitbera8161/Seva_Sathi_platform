// Mirrors backend/src/controllers/analytics.controller.js
import api from '../api/axiosClient.js'
import { ENDPOINTS } from '../api/endpoints.js'

// Public — dashboard numbers are meant to be shown off, even logged out
export async function fetchAnalyticsDashboard() {
  const { data } = await api.get(ENDPOINTS.ANALYTICS.DASHBOARD)
  return data // { overview, donorsByBloodGroup, cityWiseActivity, requestCategoryBreakdown }
}
