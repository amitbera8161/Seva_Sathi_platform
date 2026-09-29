import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import DashboardRedirect from './pages/dashboard/DashboardRedirect.jsx'
import BeneficiaryDashboard from './pages/dashboard/beneficiary/BeneficiaryDashboard.jsx'
import VolunteerDashboard from './pages/dashboard/volunteer/VolunteerDashboard.jsx'
import NGODashboard from './pages/dashboard/ngo/NGODashboard.jsx'
import AdminDashboard from './pages/dashboard/admin/AdminDashboard.jsx'
import { RequireAuth, RoleRoute } from './routes/guards.jsx'
import { DASHBOARD_TYPES } from './utils/roles.js'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* LoginPage/RegisterPage keep navigating to '/dashboard' — this
          resolves that to the user's primary-role dashboard. */}
      <Route path="/dashboard" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />

      <Route
        path="/dashboard/beneficiary"
        element={
          <RoleRoute allow={[DASHBOARD_TYPES.BENEFICIARY]}>
            <BeneficiaryDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/volunteer"
        element={
          <RoleRoute allow={[DASHBOARD_TYPES.VOLUNTEER]}>
            <VolunteerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/ngo"
        element={
          <RoleRoute allow={[DASHBOARD_TYPES.NGO]}>
            <NGODashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <RoleRoute allow={[DASHBOARD_TYPES.ADMIN]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />
    </Routes>
  )
}
