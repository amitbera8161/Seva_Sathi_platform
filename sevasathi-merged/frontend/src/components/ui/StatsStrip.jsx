import React from 'react'

const STATS = [
  { bg: '#fee2e2', icon: '❤️', n: '1,256', label: 'Active Donors' },
  { bg: '#fef9c3', icon: '📚', n: '412',   label: 'Books Shared' },
  { bg: '#dcfce7', icon: '🤲', n: '980',   label: 'Volunteers' },
  { bg: '#e0f2fe', icon: '🏢', n: '54',    label: 'NGO Partners' },
  { bg: '#f3e8ff', icon: '🌟', n: '4,200+',label: 'Lives Supported' },
]

export default function StatsStrip() {
  return (
    <div className="stats-strip">
      <div className="stats-inner">
        {STATS.map((s, i) => (
          <div className="stat-cell" key={i}>
            <div className="stat-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <span className="stat-n">{s.n}</span>
              <span className="stat-l">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
