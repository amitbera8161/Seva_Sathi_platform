import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { logoutUser } from '../../services/authService.js'

const NOTIFS = [
  { icon: '🩸', text: 'O- blood urgently needed at SSKM Hospital', time: '4 min ago', unread: true },
  { icon: '✅', text: 'Your help offer was accepted by Sunita Dey', time: '18 min ago', unread: true },
  { icon: '🤝', text: 'New volunteer joined your area: Arjun Bose', time: '1 hr ago', unread: true },
  { icon: '📦', text: 'Resource request fulfilled — NCERT Books', time: '2 hrs ago', unread: false },
  { icon: '🚨', text: 'Flood alert in North 24 PGS — 6 families affected', time: '3 hrs ago', unread: false },
]

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase()
}

export default function DashTopbar({ darkMode, onDarkToggle, onMenuOpen }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFS)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logoutUser()
    navigate('/login')
  }

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unreadCount = notifs.filter(n => n.unread).length

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })))
  }

  return (
    <header className="db-topbar">
      {/* Mobile hamburger */}
      <button className="db-topbar-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Search */}
      <div className="db-search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search donors, emergencies, resources…" />
        <kbd style={{ fontSize: '.65rem', color: 'var(--db-text-4)', background: 'var(--db-border)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit', flexShrink: 0 }}>⌘K</kbd>
      </div>

      <div className="db-topbar-actions">
        {/* Dark mode toggle */}
        <button className="db-topbar-btn" onClick={onDarkToggle} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="db-topbar-btn" onClick={() => setNotifOpen(o => !o)} aria-label="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className="dot"/>}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: '340px', background: 'var(--db-surface)',
              border: '1px solid var(--db-border)', borderRadius: '14px',
              boxShadow: 'var(--db-shadow-lg)', zIndex: 100,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--db-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '.88rem', color: 'var(--db-text)' }}>Notifications</div>
                  {unreadCount > 0 && <div style={{ fontSize: '.7rem', color: 'var(--db-text-3)' }}>{unreadCount} unread</div>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '.72rem', color: 'var(--db-ember)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
                    Mark all read
                  </button>
                )}
              </div>
              {/* List */}
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifs.map((n, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', padding: '12px 16px',
                    background: n.unread ? 'rgba(220,38,38,.04)' : 'transparent',
                    borderBottom: '1px solid var(--db-border)',
                    cursor: 'pointer', transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--db-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(220,38,38,.04)' : 'transparent'}
                  onClick={() => setNotifs(prev => prev.map((x,j) => j===i ? {...x,unread:false} : x))}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--db-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, border: '1px solid var(--db-border)' }}>{n.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.78rem', color: 'var(--db-text)', lineHeight: '1.4', fontWeight: n.unread ? '500' : '400' }}>{n.text}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--db-text-4)', marginTop: '3px' }}>{n.time}</div>
                    </div>
                    {n.unread && <div style={{ width: '7px', height: '7px', background: 'var(--db-ember)', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }}/>}
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid var(--db-border)' }}>
                <button style={{ fontSize: '.75rem', color: 'var(--db-ember)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SOS Emergency button */}
        <button className="db-emergency-btn">
          <span className="pulse-dot"/>
          <span>SOS Help</span>
        </button>

        {/* Profile avatar */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setProfileOpen((v) => !v)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #DC2626, #F87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: '700', fontSize: '.78rem',
              cursor: 'pointer', flexShrink: 0,
              border: '2px solid var(--db-border)',
            }}
          >{initialsOf(user?.fullName)}</div>

          {profileOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '44px', minWidth: '190px',
              background: 'var(--db-surface)', border: '1px solid var(--db-border)',
              borderRadius: '10px', boxShadow: 'var(--db-shadow-sm)', zIndex: 20,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--db-border)' }}>
                <div style={{ fontWeight: '600', fontSize: '.82rem', color: 'var(--db-text)' }}>{user?.fullName || 'User'}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)' }}>{user?.email || user?.phone}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  padding: '10px 14px', fontSize: '.8rem', fontWeight: '600', color: 'var(--db-red, #DC2626)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
