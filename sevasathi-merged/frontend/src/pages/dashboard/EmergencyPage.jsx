import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatDate.js'
import {
  listEmergencyRequests,
  createEmergencyRequest,
  offerHelp,
  resolveRequest,
} from '../../services/emergencyRequestService.js'

const CATS = ['All', 'Critical', 'Moderate', 'Resolved', 'blood', 'food', 'medicine', 'shelter', 'transport', 'education']

const CAT_META = {
  blood: { emoji: '🩸', label: 'Blood' },
  food: { emoji: '🍱', label: 'Food' },
  medicine: { emoji: '💊', label: 'Medicine' },
  shelter: { emoji: '🏠', label: 'Shelter' },
  transport: { emoji: '🚑', label: 'Transport' },
  education: { emoji: '📚', label: 'Education' },
  other: { emoji: '❗', label: 'Other' },
}

const EMPTY_FORM = { category: 'blood', title: '', description: '', severity: 'critical', city: '', address: '' }

const LEVEL_LABEL = { critical: 'Very Urgent', moderate: 'Can Wait', resolved: 'Resolved' }

export default function EmergencyPage() {
  const { user, isAuthenticated } = useAuth()
  const [filter, setFilter] = useState('All')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null) // id currently being helped/resolved
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState('')

  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    return listEmergencyRequests()
      .then((results) => {
        setItems(results || [])
        setLastUpdated(new Date())
      })
      .catch(() => { if (!silent) setError('Could not load requests right now. Please try again.') })
      .finally(() => { if (!silent) setLoading(false) })
  }, [])

  // Auto-refresh in the background so new/resolved requests appear without
  // the user needing to reload — matters most for critical/blood requests.
  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [load])

  const displayItems = items.map((r) => {
    const meta = CAT_META[r.category] || CAT_META.other
    const level = r.status === 'resolved' ? 'resolved' : r.severity // 'critical' | 'moderate' | 'resolved'
    return {
      id: r._id,
      emoji: meta.emoji,
      type: r.category,
      cat: meta.label,
      title: r.title,
      desc: r.description,
      loc: [r.address, r.city].filter(Boolean).join(', ') || 'Location not specified',
      time: timeAgo(r.createdAt),
      level,
      helpers: r.helpers?.length || 0,
      alreadyHelping: !!(user && r.helpers?.some((h) => (h.user?._id || h.user) === user._id)),
      postedByMe: !!(user && (r.postedBy?._id || r.postedBy) === user._id),
    }
  })

  const filtered = displayItems.filter((item) => {
    if (filter === 'All') return true
    if (filter === 'Critical') return item.level === 'critical'
    if (filter === 'Moderate') return item.level === 'moderate'
    if (filter === 'Resolved') return item.level === 'resolved'
    return item.type === filter
  })

  async function handleHelp(id) {
    if (!isAuthenticated) { setError('Log in to offer help.'); return }
    setActing(id)
    try {
      await offerHelp(id)
      await load()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session expired. Please log in again.')
      } else {
        setError('Could not offer help right now. Please try again.')
      }
    } finally {
      setActing(null)
    }
  }

  async function handleResolve(id) {
    setActing(id)
    try {
      await resolveRequest(id)
      await load()
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session expired. Please log in again.')
      } else {
        setError('Could not resolve this request. Please try again.')
      }
    } finally {
      setActing(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setPosting(true)
    try {
      await createEmergencyRequest(form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not post this request.')
    } finally {
      setPosting(false)
    }
  }

  const criticalCount = displayItems.filter((i) => i.level === 'critical').length
  const activeCount = displayItems.filter((i) => i.level !== 'resolved').length
  const resolvedCount = displayItems.filter((i) => i.level === 'resolved').length
  const totalHelpers = displayItems.reduce((a, b) => a + b.helpers, 0)

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🚨 Emergency Requests</h1>
          <p className="db-page-subtitle">Real-time help requests in your area</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="db-live-badge" style={{ background: 'var(--db-red-light)', color: 'var(--db-red)' }} title={lastUpdated ? `Last checked ${lastUpdated.toLocaleTimeString()}` : ''}>
            <span className="dot" style={{ background: 'var(--db-red)' }} />
            {criticalCount} Critical
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            style={{ background: 'var(--db-red)', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {showForm ? '✕ Cancel' : '+ Post Request'}
          </button>
        </div>
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="db-card db-animate" style={{ padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {formError && <div className="role-error">{formError}</div>}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ padding: '8px 10px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.8rem', fontFamily: 'inherit' }}
            >
              {Object.entries(CAT_META).map(([val, m]) => <option key={val} value={val}>{m.emoji} {m.label}</option>)}
            </select>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              style={{ padding: '8px 10px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.8rem', fontFamily: 'inherit' }}
            >
              <option value="critical">Very Urgent</option>
              <option value="moderate">Can Wait a Bit</option>
            </select>
          </div>
          <input
            type="text" placeholder="Title (e.g. A+ Blood Urgently Required)" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit' }}
          />
          <textarea
            placeholder="Describe what's needed…" value={form.description} rows={3}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text" placeholder="City" value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit' }}
            />
            <input
              type="text" placeholder="Address / landmark" value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              style={{ flex: 2, padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit' }}
            />
          </div>
          <button
            type="submit" disabled={posting}
            style={{ alignSelf: 'flex-start', background: 'var(--db-red)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '.8rem', fontWeight: '600', cursor: posting ? 'default' : 'pointer', fontFamily: 'inherit', opacity: posting ? 0.7 : 1 }}
          >
            {posting ? 'Posting…' : 'Post Request'}
          </button>
        </form>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }} className="db-animate db-animate-1">
        {[
          { label: 'Active', val: activeCount, color: '#DC2626', bg: 'var(--db-red-light)' },
          { label: 'Resolved', val: resolvedCount, color: '#10B981', bg: 'var(--db-green-bg)' },
          { label: 'Volunteers Helping', val: totalHelpers, color: '#3B82F6', bg: 'var(--db-mist)' },
        ].map(s => (
          <div className="db-card" key={s.label} style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--db-text-3)', marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="db-filter-bar db-animate db-animate-2" style={{ padding: '0 0 16px', flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} className={`db-filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
            {CAT_META[c]?.label || c}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading requests…</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No requests match this filter yet.</div>
      )}

      {/* Emergency Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="db-animate db-animate-3">
        {filtered.map(item => (
          <div key={item.id} className={`db-card db-emergency-item`} style={{ padding: 0 }}>
            <div style={{ display: 'flex', gap: '14px', padding: '16px', borderLeft: `4px solid ${item.level === 'critical' ? 'var(--db-red)' : item.level === 'resolved' ? 'var(--db-green)' : 'var(--db-amber)'}` }}>
              <div className={`db-em-icon ${item.type}`} style={{ width: '46px', height: '46px', fontSize: '1.3rem' }}>{item.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="db-em-title" style={{ fontSize: '.9rem' }}>{item.title}</span>
                  <span className={`db-priority-badge ${item.level}`}>{LEVEL_LABEL[item.level] || item.level}</span>
                  <span style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', padding: '2px 8px', borderRadius: '10px', fontSize: '.62rem', color: 'var(--db-text-3)', fontWeight: '600' }}>{item.cat}</span>
                </div>
                <p style={{ fontSize: '.8rem', color: 'var(--db-text-2)', marginTop: '5px', lineHeight: '1.5' }}>{item.desc}</p>
                <div className="db-em-meta" style={{ marginTop: '7px' }}>
                  <span>📍 {item.loc}</span>
                  <span>⏱ {item.time}</span>
                  <span style={{ color: 'var(--db-blue-2)' }}>🤝 {item.helpers} helping</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, alignItems: 'flex-end' }}>
                {item.level !== 'resolved' && !item.alreadyHelping && (
                  <button
                    onClick={() => handleHelp(item.id)}
                    disabled={acting === item.id}
                    style={{ background: item.level === 'critical' ? 'var(--db-red)' : 'var(--db-blue-2)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '.78rem', fontWeight: '600', cursor: acting === item.id ? 'default' : 'pointer', fontFamily: 'inherit', opacity: acting === item.id ? 0.7 : 1 }}
                  >
                    ✋ {acting === item.id ? 'Helping…' : 'Help Now'}
                  </button>
                )}
                {item.level !== 'resolved' && item.alreadyHelping && (
                  <span style={{ background: 'var(--db-green-bg)', color: 'var(--db-green)', padding: '6px 12px', borderRadius: '8px', fontSize: '.78rem', fontWeight: '600' }}>✓ You&apos;re helping</span>
                )}
                {item.level !== 'resolved' && item.postedByMe && (
                  <button
                    onClick={() => handleResolve(item.id)}
                    disabled={acting === item.id}
                    style={{ background: 'transparent', color: 'var(--db-text-3)', border: '1px solid var(--db-border)', borderRadius: '8px', padding: '6px 12px', fontSize: '.72rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Mark resolved
                  </button>
                )}
                {item.level === 'resolved' && (
                  <span style={{ background: 'var(--db-green-bg)', color: 'var(--db-green)', padding: '6px 12px', borderRadius: '8px', fontSize: '.78rem', fontWeight: '600' }}>✅ Resolved</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
