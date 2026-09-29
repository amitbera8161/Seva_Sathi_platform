import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthBrand() {
  return (
    <>
      <Link to="/" className="auth-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Home
      </Link>

      <div className="auth-brand">
        <div className="auth-logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <div className="auth-logo-name">SevaSathi</div>
          <div className="auth-logo-sub">Local Community · Real Impact</div>
        </div>
      </div>
    </>
  )
}
