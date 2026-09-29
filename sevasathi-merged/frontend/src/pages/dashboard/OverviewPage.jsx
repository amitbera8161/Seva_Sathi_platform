import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatDate.js'
import { fetchAnalyticsDashboard } from '../../services/analyticsService.js'
import { listEmergencyRequests } from '../../services/emergencyRequestService.js'

const CAT_META = {
  blood: { emoji: '🩸' },
  food: { emoji: '🍱' },
  medicine: { emoji: '💊' },
  shelter: { emoji: '🏠' },
  transport: { emoji: '🚑' },
  education: { emoji: '📚' },
  other: { emoji: '❗' },
}

// Simple SVG line chart — still a visual placeholder (no time-series
// endpoint exists on the backend yet), kept but clearly not claimed as live.
function MiniLineChart() {
  const points = [30, 45, 38, 60, 52, 70, 65, 80, 74, 90, 85, 95]
  const W = 100, H = 50
  const max = Math.max(...points)
  const coords = points.map((v, i) => [i * (W / (points.length - 1)), H - (v / max) * H])
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0]},${c[1]}`).join(' ')
  const areaD = `${pathD} L${W},${H} L0,${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ height: '80px' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e88e5" stopOpacity=".22" />
          <stop offset="100%" stopColor="#1e88e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#1e88e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => i === coords.length - 1 && (
        <circle key={i} cx={c[0]} cy={c[1]} r="2.5" fill="#DC2626" />
      ))}
    </svg>
  )
}

const STAT_META = [
  { key: 'totalDonors', label: 'Active Donors', accent: '#c0392b', iconBg: 'var(--db-red-light)', iconColor: 'var(--db-ember)' },
  { key: 'totalRequests', label: 'Total Help Requests', accent: '#f59e0b', iconBg: 'var(--db-yellow-bg)', iconColor: 'var(--db-yellow)' },
  { key: 'totalVolunteers', label: 'Active Volunteers', accent: '#16a974', iconBg: 'var(--db-green-bg)', iconColor: 'var(--db-green)' },
  { key: 'resolutionRate', label: 'Resolution Rate', suffix: '%', accent: '#1565c0', iconBg: 'var(--db-mist)', iconColor: 'var(--db-blue-2)' },
]

const BLOOD_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

export default function OverviewPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [emergencies, setEmergencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchAnalyticsDashboard(), listEmergencyRequests({ status: 'open' })])
      .then(([a, reqs]) => {
        if (cancelled) return
        setAnalytics(a)
        setEmergencies((reqs || []).slice(0, 4))
      })
      .catch(() => !cancelled && setError('Could not load live community stats right now.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const overview = analytics?.overview
  const bloodByGroup = analytics?.donorsByBloodGroup || []

  return (
    <div>
      {/* Header */}
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">Good morning, {firstName} 👋</h1>
          <p className="db-page-subtitle">Here's what's happening in your community today</p>
        </div>
        <div className="db-live-badge">
          <span className="dot" />
          Live Updates
        </div>
      </div>

      {error && <div className="role-error db-animate" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Stats */}
      <div className="db-stats-grid db-animate db-animate-2">
        {STAT_META.map((s) => (
          <div className="db-stat-card" key={s.key} style={{ '--card-accent': s.accent, '--card-icon-bg': s.iconBg, '--card-icon-color': s.iconColor }}>
            <div className="db-stat-icon-wrap">{BLOOD_ICON}</div>
            <div className="db-stat-value">
              {loading ? '—' : `${overview?.[s.key] ?? 0}${s.suffix || ''}`}
            </div>
            <div className="db-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Chart + Blood */}
      <div className="db-grid-2 db-animate db-animate-3" style={{ marginBottom: '16px' }}>
        {/* Activity Chart — not yet backed by a time-series endpoint */}
        <div className="db-card">
          <div className="db-card-header">
            <div>
              <div className="db-card-title">Community Activity</div>
              <div className="db-card-subtitle">Illustrative trend — historical data coming soon</div>
            </div>
          </div>
          <div className="db-card-body">
            <MiniLineChart />
          </div>
        </div>

        {/* Blood Availability — real data from analytics.donorsByBloodGroup */}
        <div className="db-card">
          <div className="db-card-header">
            <div>
              <div className="db-card-title">🩸 Blood Availability</div>
              <div className="db-card-subtitle">Registered donors by group</div>
            </div>
            <div className="db-live-badge" style={{ fontSize: '.65rem' }}>
              <span className="dot" />Live
            </div>
          </div>
          <div className="db-blood-grid">
            {loading && <div style={{ padding: '12px', fontSize: '.8rem', color: 'var(--db-text-3)' }}>Loading…</div>}
            {!loading && bloodByGroup.length === 0 && (
              <div style={{ padding: '12px', fontSize: '.8rem', color: 'var(--db-text-3)' }}>No donors registered yet.</div>
            )}
            {!loading && bloodByGroup.map((b) => (
              <div className={`db-blood-item ${b.count <= 3 ? 'critical' : ''}`} key={b.bloodGroup}>
                <div className="db-blood-type">{b.bloodGroup}</div>
                <div className="db-blood-count">{b.count} donor{b.count === 1 ? '' : 's'}</div>
                <div className={`db-blood-dot ${b.count <= 3 ? 'low' : b.count <= 10 ? 'med' : 'high'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Real active emergencies */}
      <div className="db-card db-animate db-animate-4">
        <div className="db-card-header">
          <div>
            <div className="db-card-title">🚨 Active Emergencies</div>
            <div className="db-card-subtitle">Most recent open requests</div>
          </div>
        </div>
        <div style={{ height: '12px' }} />
        {loading && <div style={{ padding: '0 20px 16px', fontSize: '.85rem', color: 'var(--db-text-3)' }}>Loading…</div>}
        {!loading && emergencies.length === 0 && (
          <div style={{ padding: '0 20px 16px', fontSize: '.85rem', color: 'var(--db-text-3)' }}>No open emergencies right now.</div>
        )}
        <div className="db-emergency-list">
          {emergencies.map((e) => {
            const meta = CAT_META[e.category] || CAT_META.other
            return (
              <div className={`db-emergency-item ${e.severity}`} key={e._id}>
                <div className={`db-em-icon ${e.category}`}>{meta.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="db-em-title">{e.title}</div>
                  <div className="db-em-meta">
                    <span>📍 {[e.address, e.city].filter(Boolean).join(', ') || 'Location not specified'}</span>
                    <span>⏱ {timeAgo(e.createdAt)}</span>
                  </div>
                </div>
                <span className={`db-priority-badge ${e.severity}`}>{e.severity}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
