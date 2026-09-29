import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { searchBloodDonors } from '../../services/bloodDonorService.js'

const GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase()
}

const AVATAR_COLORS = ['#DC2626', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6', '#F97316']

export default function BloodNetworkPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [activeGroup, setActiveGroup] = useState('All')
  const [search, setSearch] = useState('')
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDonors = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await searchBloodDonors({
        bloodGroup: activeGroup === 'All' ? undefined : activeGroup,
        city: search || undefined,
      })
      setDonors(results || [])
    } catch (err) {
      setError('We couldn\'t load donors right now. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [activeGroup, search])

  useEffect(() => {
    const t = setTimeout(loadDonors, 300) // small debounce for the search box
    return () => clearTimeout(t)
  }, [loadDonors])

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🩸 Blood Network</h1>
          <p className="db-page-subtitle">Find nearby verified blood donors instantly</p>
        </div>
        <div className="db-live-badge">
          <span className="dot" />
          {donors.length} Available Now
        </div>
      </div>

      {/* Filters */}
      <div className="db-card db-animate db-animate-2" style={{ marginBottom: '16px' }}>
        <div className="db-card-header">
          <div className="db-card-title">Filter by Blood Group</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="db-search-bar" style={{ maxWidth: '220px', height: '34px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search by city…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="db-filter-bar" style={{ paddingTop: '12px' }}>
          {GROUPS.map(g => (
            <button key={g} className={`db-filter-btn ${activeGroup === g ? 'active' : ''}`} onClick={() => setActiveGroup(g)}>
              {g === 'All' ? '🩸 ' : ''}{g}
            </button>
          ))}
        </div>
      </div>

      {/* Donors Grid */}
      <div className="db-card db-animate db-animate-4">
        <div className="db-card-header">
          <div>
            <div className="db-card-title">Verified Donors</div>
            <div className="db-card-subtitle">
              {loading ? 'Searching…' : `${donors.length} donors found`}
              {!loading && !isAuthenticated && donors.length > 0 && ' · Log in to see phone numbers and call a donor'}
            </div>
          </div>
        </div>

        {error && (
          <div className="role-error" style={{ margin: '0 20px 16px' }}>{error}</div>
        )}

        {!loading && !error && donors.length === 0 && (
          <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>
            No donors found for this filter yet. Try a different blood group or clear the city search.
          </div>
        )}

        <div className="db-donor-grid" style={{ paddingTop: '16px' }}>
          {donors.map((d, i) => (
            <div className="db-donor-card" key={d._id || i}>
              <div className="db-donor-bg" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{d.bloodGroup}</div>
              <div style={{ flex: 1 }}>
                <div className="db-donor-name">{initialsOf(d.user?.fullName)} · {d.user?.fullName || 'Anonymous donor'}</div>
                <div className="db-donor-meta">📍 {d.city || 'City not set'}{d.pincode ? ` · ${d.pincode}` : ''}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                  {d.isVerifiedDonor && <span className="db-donor-badge">✓ Verified</span>}
                  <span style={{ fontSize: '.62rem', padding: '2px 6px', borderRadius: '10px', display: 'inline-block', background: 'var(--db-green-bg)', color: 'var(--db-green)', fontWeight: '600' }}>
                    ● Available
                  </span>
                </div>
              </div>
              {isAuthenticated && d.user?.phone ? (
                <a
                  className="db-donor-contact"
                  href={`tel:${d.user.phone}`}
                  title={`Call ${d.user.fullName || 'donor'}`}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
              ) : (
                <button
                  className="db-donor-contact"
                  title={isAuthenticated ? 'Phone number not available' : 'Log in to see contact details'}
                  disabled={isAuthenticated}
                  onClick={() => !isAuthenticated && navigate('/login')}
                  style={{ opacity: isAuthenticated ? 0.4 : 1, cursor: isAuthenticated ? 'default' : 'pointer' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
