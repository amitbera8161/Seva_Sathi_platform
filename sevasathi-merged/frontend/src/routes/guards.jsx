import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardPath, getDashboardType } from '../utils/roles.js'

// Unchanged from the original App.jsx — just moved here so it can be
// reused by RoleRoute without duplicating the "wait for rehydration"
// logic in two places.
export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null // wait for localStorage rehydration before deciding
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Gates a dashboard route to specific dashboard types (see utils/roles.js).
// Logged-out users go to /login; logged-in users whose primary role
// doesn't match are sent to *their own* dashboard instead of a dead end.
export function RoleRoute({ allow, children }) {
  const { user, isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const type = getDashboardType(user?.roles)
  if (!allow.includes(type)) {
    return <Navigate to={getDashboardPath(user?.roles)} replace />
  }
  return children
}
