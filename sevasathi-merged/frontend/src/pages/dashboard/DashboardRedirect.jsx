import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getDashboardPath } from '../../utils/roles.js'

// Mounted at /dashboard. LoginPage still navigates to '/dashboard' after
// login (untouched) — this is what routes that to the right role-specific
// dashboard based on the user's primary role.
export default function DashboardRedirect() {
  const { user } = useAuth()
  return <Navigate to={getDashboardPath(user?.roles)} replace />
}
