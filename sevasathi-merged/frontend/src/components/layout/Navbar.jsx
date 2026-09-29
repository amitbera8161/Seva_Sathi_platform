import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const INITIAL_ALERTS = [
  {
    id: 1,
    dotClass: 'blood',
    title: '🩸 B+ Blood Needed Urgently',
    location: '📍 Rajpur, 1.2 km',
    time: '⏱ 14 min ago',
  },
  {
    id: 2,
    dotClass: 'food',
    title: '🍱 Family Needs Food Support',
    location: '📍 Sonarpur, 2.8 km',
    time: '⏱ 32 min ago',
  },
  {
    id: 3,
    dotClass: 'med',
    title: '💊 Medicine Help for Elderly',
    location: '📍 Garia, 4.1 km',
    time: '⏱ 1 hr ago',
  },
]

export default function Navbar() {
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [dismissing, setDismissing] = useState([])
  const wrapRef = useRef(null)

  /* Close emergency dropdown on outside click */
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setEmergencyOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function dismissAlert(e, id) {
    e.stopPropagation()
    setDismissing((prev) => [...prev, id])
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      setDismissing((prev) => prev.filter((d) => d !== id))
    }, 280)
  }

  function handleNavLinkClick() {
    setMobileOpen(false)
  }

  function handleSmoothScroll(e, target) {
    if (target && target.startsWith('#') && target.length > 1) {
      e.preventDefault()
      const el = document.querySelector(target)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileOpen(false)
  }

  return (
    <>
      <div className="nav-wrap">
        <nav>
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <span className="logo-name">SevaSathi</span>
              <span className="logo-sub">Local Community · Real Impact</span>
            </div>
          </Link>

          {/* Nav Links */}
          <ul className="nav-links">
            <li><a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>Services</a></li>
            <li><a href="#ngo" onClick={(e) => handleSmoothScroll(e, '#ngo')}>NGOs</a></li>
            <li><a href="#how" onClick={(e) => handleSmoothScroll(e, '#how')}>How It Works</a></li>
            <li><a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About</a></li>
            <li><Link to="/dashboard" style={{ color: 'var(--ember)', fontWeight: 600 }} onClick={handleNavLinkClick}>Dashboard →</Link></li>
          </ul>

          {/* Emergency Alert Button */}
          <div className="nav-emergency-wrap" ref={wrapRef}>
            <button
              className="nav-emergency-btn"
              id="emergencyBtn"
              onClick={() => setEmergencyOpen((o) => !o)}
            >
              <div className="pulse-ring"></div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="btn-label">Emergency Alerts</span>
              {alerts.length > 0 && (
                <span className="emergency-count" id="alertCount">{alerts.length}</span>
              )}
            </button>

            {/* Emergency Dropdown */}
            <div className={`emergency-dropdown${emergencyOpen ? ' open' : ''}`} id="emergencyDropdown">
              <div className="ed-header">
                <div className="ed-header-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <h4>Active Emergency Alerts</h4>
                    <div className="ed-header-sub">{alerts.length} urgent requests near you</div>
                  </div>
                </div>
                <button className="ed-close" onClick={() => setEmergencyOpen(false)} title="Close">✕</button>
              </div>

              <div className="ed-body" id="alertList">
                {alerts.length === 0 ? (
                  <div style={{ padding: '28px', textAlign: 'center', color: '#7a92ab', fontSize: '.88rem' }}>
                    ✅ No active alerts near you right now
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="ed-item"
                      data-id={alert.id}
                      style={
                        dismissing.includes(alert.id)
                          ? { opacity: 0, transform: 'translateX(14px)', transition: 'opacity .25s, transform .25s' }
                          : {}
                      }
                    >
                      <div className={`ed-dot ${alert.dotClass}`}></div>
                      <div className="ed-item-text">
                        <div className="ed-item-title">{alert.title}</div>
                        <div className="ed-item-meta">
                          <span>{alert.location}</span>
                          <span>{alert.time}</span>
                        </div>
                      </div>
                      <button className="ed-action">Respond</button>
                      <button
                        className="ed-cancel"
                        onClick={(e) => dismissAlert(e, alert.id)}
                        title="Dismiss this alert"
                      >✕</button>
                    </div>
                  ))
                )}
              </div>

              <div className="ed-footer">
                <a href="#">View all alerts →</a>
                <button className="ed-post">+ Post Emergency</button>
              </div>
            </div>
          </div>

          {/* Login / Register */}
          <Link to="/login" className="nav-register">Login / Register</Link>

          {/* Hamburger (mobile) */}
          <div className="hamburger" onClick={() => setMobileOpen((o) => !o)}>
            <span></span><span></span><span></span>
          </div>
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`} id="mobileNav">
        <a href="#services" onClick={(e) => handleSmoothScroll(e, '#services')}>Services</a>
        <a href="#ngo" onClick={(e) => handleSmoothScroll(e, '#ngo')}>NGOs &amp; Volunteers</a>
        <a href="#how" onClick={(e) => handleSmoothScroll(e, '#how')}>How It Works</a>
        <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')}>About</a>
        <Link to="/dashboard" className="mob-primary" onClick={handleNavLinkClick} style={{ background: 'var(--ember)', marginBottom: '8px' }}>Dashboard →</Link>
        <Link to="/login" className="mob-primary" onClick={handleNavLinkClick}>Login / Register</Link>
      </div>
    </>
  )
}
