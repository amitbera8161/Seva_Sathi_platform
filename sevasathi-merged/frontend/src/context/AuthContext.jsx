import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Rehydrate the logged-in user from localStorage on first load
    const stored = localStorage.getItem('sevasathi_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('sevasathi_user', JSON.stringify(userData))
    if (token) localStorage.setItem('sevasathi_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('sevasathi_user')
    localStorage.removeItem('sevasathi_token')
    setUser(null)
  }

  // Merges fresh fields (e.g. after Settings saves a profile edit) into
  // both state and localStorage, so the sidebar/greeting update immediately
  // without needing a full re-login.
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('sevasathi_user', JSON.stringify(next))
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook for consuming the auth context anywhere in the app
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>')
  return ctx
}
