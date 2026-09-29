import React, { useState, useEffect, useCallback } from 'react'
import { searchVolunteers } from '../../services/volunteerService.js'
import { listNGOs } from '../../services/ngoService.js'
import { listResources, createResource, requestResource } from '../../services/resourceService.js'
import { listPosts, createPost, togglePostLike } from '../../services/postService.js'
import { fetchAnalyticsDashboard } from '../../services/analyticsService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatDate.js'

// ══════════════ RESOURCES ══════════════
// Backed by GET/POST /resources (see backend/src/controllers/resource.controller.js).
const RES_CAT_META = {
  food: { emoji: '🍱', color: '#F59E0B', bg: 'var(--db-amber-bg)', label: 'Food' },
  books: { emoji: '📚', color: '#3B82F6', bg: 'var(--db-blue-bg)', label: 'Books' },
  clothes: { emoji: '👗', color: '#8B5CF6', bg: 'var(--db-purple-bg)', label: 'Clothes' },
  medicine: { emoji: '💊', color: '#DC2626', bg: 'var(--db-red-light)', label: 'Medicine' },
  tuition: { emoji: '🎓', color: '#10B981', bg: 'var(--db-emerald-bg)', label: 'Tuition' },
  other: { emoji: '📦', color: '#64748B', bg: 'var(--db-border)', label: 'Other' },
}
const RES_CATS = ['All', 'food', 'books', 'clothes', 'medicine', 'tuition']
const EMPTY_RESOURCE_FORM = { category: 'food', title: '', description: '', city: '' }

export function ResourcesPage() {
  const { isAuthenticated } = useAuth()
  const [cat, setCat] = useState('All')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(null)
  const [requested, setRequested] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_RESOURCE_FORM)
  const [posting, setPosting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listResources({ category: cat === 'All' ? undefined : cat })
      .then((results) => setResources(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load resources. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [cat])

  useEffect(() => { load() }, [load])

  async function handleRequest(id, avail) {
    if (!avail) return
    if (!isAuthenticated) { setError('Log in to request a resource.'); return }
    setRequesting(id)
    try {
      await requestResource(id)
      setRequested((p) => [...p, id])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send this request.')
    } finally {
      setRequesting(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setPosting(true)
    try {
      await createResource(form)
      setForm(EMPTY_RESOURCE_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share this resource.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">📦 Resource Exchange</h1>
          <p className="db-page-subtitle">Share and request community resources</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ background: 'var(--db-green)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {showForm ? '✕ Cancel' : '+ Share Resource'}
        </button>
      </div>

      {error && <div className="role-error" style={{ margin: '0 0 16px' }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="db-card db-animate" style={{ padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ padding: '8px 10px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.8rem', fontFamily: 'inherit' }}
            >
              {Object.entries(RES_CAT_META).map(([val, m]) => <option key={val} value={val}>{m.emoji} {m.label}</option>)}
            </select>
            <input
              type="text" placeholder="City" value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.8rem', fontFamily: 'inherit' }}
            />
          </div>
          <input
            type="text" placeholder="What are you sharing?" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit' }}
          />
          <textarea
            placeholder="Any details (condition, quantity, pickup notes)…" value={form.description} rows={2}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            style={{ padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <button
            type="submit" disabled={posting}
            style={{ alignSelf: 'flex-start', background: 'var(--db-green)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '.8rem', fontWeight: '600', cursor: posting ? 'default' : 'pointer', fontFamily: 'inherit', opacity: posting ? 0.7 : 1 }}
          >
            {posting ? 'Sharing…' : 'Share Resource'}
          </button>
        </form>
      )}

      <div className="db-filter-bar db-animate db-animate-1" style={{ padding: '0 0 16px' }}>
        {RES_CATS.map(c => (
          <button key={c} className={`db-filter-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'All' ? 'All' : RES_CAT_META[c]?.label || c}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && resources.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No resources shared yet in this category.</div>
      )}

      <div className="db-resource-grid db-animate db-animate-2" style={{ padding: 0 }}>
        {resources.map((r) => {
          const meta = RES_CAT_META[r.category] || RES_CAT_META.other
          const alreadyRequested = requested.includes(r._id)
          return (
            <div className="db-resource-card" key={r._id}>
              <div className="db-resource-img" style={{ background: meta.bg }}>{meta.emoji}</div>
              <div className="db-resource-body">
                <div className="db-resource-cat" style={{ color: meta.color }}>{meta.label}</div>
                <div className="db-resource-title">{r.title}</div>
                <div className="db-resource-loc">👤 {r.postedBy?.fullName || 'Someone'} · 📍 {r.city || 'City not set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '.65rem', fontWeight: '600', color: r.isAvailable ? 'var(--db-emerald)' : 'var(--db-text-4)' }}>
                    {r.isAvailable ? '● Available' : '○ Unavailable'}
                  </span>
                </div>
                <button
                  className="db-resource-btn"
                  onClick={() => handleRequest(r._id, r.isAvailable)}
                  disabled={requesting === r._id}
                  style={{
                    background: alreadyRequested ? 'var(--db-emerald-bg)' : r.isAvailable ? meta.bg : 'var(--db-border)',
                    color: alreadyRequested ? 'var(--db-emerald)' : r.isAvailable ? meta.color : 'var(--db-text-4)',
                    cursor: r.isAvailable ? 'pointer' : 'not-allowed',
                  }}
                >
                  {alreadyRequested ? '✓ Requested' : r.isAvailable ? 'Request This' : 'Unavailable'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════ VOLUNTEERS ══════════════
// Backed by GET /volunteers/search (see backend/src/controllers/volunteer.controller.js).
// The backend has no "leaderboard" or "events" listing endpoint yet, so this
// is a real search over registered volunteer profiles rather than mock stats.
const CAUSES = [
  { value: '', label: 'All causes' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'food_relief', label: 'Food Relief' },
  { value: 'disaster_response', label: 'Disaster Response' },
  { value: 'environment', label: 'Environment' },
  { value: 'elderly_care', label: 'Elderly Care' },
  { value: 'child_welfare', label: 'Child Welfare' },
  { value: 'animal_welfare', label: 'Animal Welfare' },
  { value: 'community_events', label: 'Community Events' },
]

function volInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase()
}

const VOL_COLORS = ['#DC2626', '#1e88e5', '#16a974', '#7c3aed', '#f59e0b', '#0ea5e9', '#db2777']

export function VolunteersPage() {
  const [cause, setCause] = useState('')
  const [city, setCity] = useState('')
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    searchVolunteers({ cause: cause || undefined, city: city || undefined })
      .then((results) => { if (!cancelled) setVolunteers(results || []) })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Could not load volunteers. Is the backend running?') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [cause, city])

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🤝 Volunteers</h1>
          <p className="db-page-subtitle">Find volunteers by cause and city</p>
        </div>
      </div>

      <div className="db-card db-animate db-animate-1" style={{ marginBottom: '16px' }}>
        <div className="db-card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="db-card-title">Search Volunteers</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.78rem', fontFamily: 'inherit' }}
            >
              {CAUSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="db-search-bar" style={{ maxWidth: '220px', height: '34px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search by city…" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
        </div>

        {error && <div className="role-error" style={{ margin: '16px 20px 0' }}>{error}</div>}

        <div className="db-vol-list" style={{ paddingTop: '12px' }}>
          {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Searching…</div>}

          {!loading && !error && volunteers.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>
              No volunteers found for this filter yet.
            </div>
          )}

          {!loading && volunteers.map((v, i) => (
            <div className="db-vol-item" key={v._id || i}>
              <div className="db-vol-avatar" style={{ background: VOL_COLORS[i % VOL_COLORS.length] }}>{volInitials(v.user?.fullName)}</div>
              <div style={{ flex: 1 }}>
                <div className="db-vol-name">{v.user?.fullName || 'Volunteer'}</div>
                <div className="db-vol-stat">{v.city || 'City not set'}</div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {(v.causes || []).map((c) => (
                    <span key={c} style={{ fontSize: '.6rem', background: 'var(--db-bg)', border: '1px solid var(--db-border)', padding: '2px 6px', borderRadius: '10px', color: 'var(--db-text-3)', fontWeight: '500' }}>
                      {CAUSES.find((x) => x.value === c)?.label || c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="db-vol-hrs">
                <div className="h">{v.totalHoursContributed || 0}h</div>
                <div className="l">{v.totalEventsAttended || 0} events</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════ COMMUNITY FEED ══════════════
// Backed by GET/POST /posts (see backend/src/controllers/post.controller.js).
const TYPE_META = {
  story: { label: 'Story', color: '#10B981', bg: 'var(--db-emerald-bg)' },
  update: { label: 'Update', color: '#F59E0B', bg: 'var(--db-amber-bg)' },
  highlight: { label: 'Highlight', color: '#8B5CF6', bg: 'var(--db-purple-bg)' },
}
const FEED_COLORS = ['#DC2626', '#1e88e5', '#16a974', '#7c3aed', '#f59e0b', '#0ea5e9', '#db2777']

function feedInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase()
}

export function CommunityFeedPage() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [type, setType] = useState('story')
  const [posting, setPosting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listPosts()
      .then((results) => setPosts(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load the feed. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleLike(id) {
    if (!isAuthenticated) { setError('Log in to like a post.'); return }
    try {
      const { liked } = await togglePostLike(id)
      setPosts((prev) => prev.map((p) => {
        if (p._id !== id) return p
        const likes = liked ? [...p.likes, user._id] : p.likes.filter((uid) => uid !== user._id)
        return { ...p, likes }
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this like.')
    }
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    try {
      await createPost({ type, text })
      setText('')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not share this post.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">💬 Community Feed</h1>
          <p className="db-page-subtitle">Stories, updates, and highlights from your community</p>
        </div>
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {isAuthenticated && (
        <form onSubmit={handlePost} className="db-card db-animate" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            placeholder="Share a story, update, or highlight with your community…" value={text} rows={2}
            onChange={(e) => setText(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={type} onChange={(e) => setType(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--db-border)', borderRadius: '8px', background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.78rem', fontFamily: 'inherit' }}
            >
              <option value="story">Story</option>
              <option value="update">Update</option>
              <option value="highlight">Highlight</option>
            </select>
            <button
              type="submit" disabled={posting}
              style={{ background: 'var(--db-blue)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '.8rem', fontWeight: '600', cursor: posting ? 'default' : 'pointer', fontFamily: 'inherit', opacity: posting ? 0.7 : 1 }}
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading feed…</div>}
      {!loading && posts.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No posts yet — be the first to share something.</div>
      )}

      <div className="db-feed-list db-animate db-animate-1" style={{ padding: 0 }}>
        {posts.map((p, i) => {
          const meta = TYPE_META[p.type] || TYPE_META.story
          const liked = !!(user && p.likes?.includes(user._id))
          return (
            <div className="db-feed-item" key={p._id}>
              <div className="db-feed-header">
                <div className="db-feed-avatar" style={{ background: FEED_COLORS[i % FEED_COLORS.length] }}>{feedInitials(p.author?.fullName)}</div>
                <div>
                  <div className="db-feed-name">{p.author?.fullName || 'SevaSathi user'}</div>
                  <div className="db-feed-time">{timeAgo(p.createdAt)}</div>
                </div>
                <span className="db-feed-type-badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
              </div>
              <p className="db-feed-text">{p.text}</p>
              <div className="db-feed-actions">
                <button className="db-feed-action-btn" onClick={() => handleLike(p._id)} style={{ color: liked ? 'var(--db-red)' : undefined }}>
                  <svg viewBox="0 0 24 24" fill={liked ? 'var(--db-red)' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {p.likes?.length || 0}
                </button>
                <button className="db-feed-action-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {p.comments?.length || 0}
                </button>
                <button className="db-feed-action-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════ ANALYTICS ══════════════
function SimpleBarH({ label, val, max, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '.78rem', color: 'var(--db-text-2)' }}>{label}</span>
        <span style={{ fontSize: '.78rem', fontWeight: '700', color: 'var(--db-text)', fontFamily: 'Outfit' }}>{val}</span>
      </div>
      <div className="db-progress-bar">
        <div className="db-progress-fill" style={{ width: `${(val/max)*100}%`, '--bar-color': color }} />
      </div>
    </div>
  )
}

// Backed by GET /analytics/dashboard (see backend/src/controllers/analytics.controller.js).
// That endpoint aggregates live counts across BloodDonor, EmergencyRequest,
// Resource, Post, and Volunteer collections — nothing here is hardcoded.
const BLOOD_BAR_COLORS = { 'O+': '#c0392b', 'B+': '#1e88e5', 'A+': '#16a974', 'AB+': '#7c3aed', 'O-': '#f59e0b', 'B-': '#0ea5e9', 'A-': '#db2777', 'AB-': '#64748B' }
const CITY_BAR_COLORS = ['#1565c0', '#16a974', '#7c3aed', '#c0392b', '#f59e0b', '#0ea5e9', '#db2777', '#64748B']
const CATEGORY_EMOJI = { blood: '🩸', food: '🍱', medicine: '💊', shelter: '🏠', transport: '🚑', education: '📚', other: '❗' }
const CATEGORY_COLOR = { blood: '#c0392b', food: '#f59e0b', medicine: '#1565c0', shelter: '#7c3aed', transport: '#16a974', education: '#0ea5e9', other: '#64748B' }

export function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAnalyticsDashboard()
      .then((results) => { if (!cancelled) setData(results) })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Could not load analytics. Is the backend running?') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">📊 Analytics</h1>
          <p className="db-page-subtitle">Community impact and growth metrics</p>
        </div>
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading analytics…</div>}

      {!loading && data && (
        <>
          <div className="db-stats-grid db-animate db-animate-1">
            {[
              { val: data.overview.totalDonors.toLocaleString(), label: 'Total Donors', color: '#c0392b', icon: '🩸' },
              { val: data.overview.helpRequestsFulfilled.toLocaleString(), label: 'Help Requests Fulfilled', color: '#16a974', icon: '✅' },
              { val: data.overview.volunteerHours.toLocaleString(), label: 'Volunteer Hours', color: '#1565c0', icon: '⏱' },
              { val: `${data.overview.resolutionRate}%`, label: 'Resolution Rate', color: '#7c3aed', icon: '📈' },
            ].map(s => (
              <div className="db-stat-card" key={s.label} style={{ '--card-accent': s.color }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{s.icon}</div>
                <div className="db-stat-value" style={{ color: s.color }}>{s.val}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="db-grid-2 db-animate db-animate-2" style={{ marginTop: '16px' }}>
            <div className="db-card">
              <div className="db-card-header"><div className="db-card-title">Registered Donors by Blood Group</div></div>
              <div className="db-card-body" style={{ paddingTop: '16px' }}>
                {data.donorsByBloodGroup.length === 0 && <div style={{ fontSize: '.8rem', color: 'var(--db-text-3)' }}>No donors registered yet.</div>}
                {data.donorsByBloodGroup.map((row) => (
                  <SimpleBarH key={row.bloodGroup} label={row.bloodGroup} val={row.count} max={data.donorsByBloodGroup[0]?.count || 1} color={BLOOD_BAR_COLORS[row.bloodGroup] || '#64748B'} />
                ))}
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-header"><div className="db-card-title">City-wise Activity</div></div>
              <div className="db-card-body" style={{ paddingTop: '16px' }}>
                {data.cityWiseActivity.length === 0 && <div style={{ fontSize: '.8rem', color: 'var(--db-text-3)' }}>No activity recorded yet.</div>}
                {data.cityWiseActivity.map((row, i) => (
                  <SimpleBarH key={row.city} label={row.city} val={row.count} max={data.cityWiseActivity[0]?.count || 1} color={CITY_BAR_COLORS[i % CITY_BAR_COLORS.length]} />
                ))}
              </div>
            </div>

            <div className="db-card db-col-span-2">
              <div className="db-card-header"><div className="db-card-title">Help Request Categories</div></div>
              <div className="db-card-body" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(data.requestCategoryBreakdown.length, 1)},1fr)`, gap: '12px', paddingTop: '16px', textAlign: 'center' }}>
                {data.requestCategoryBreakdown.length === 0 && <div style={{ fontSize: '.8rem', color: 'var(--db-text-3)', gridColumn: '1 / -1' }}>No emergency requests posted yet.</div>}
                {data.requestCategoryBreakdown.map((row) => (
                  <div key={row.category} style={{ background: 'var(--db-bg)', borderRadius: '12px', padding: '16px 8px', border: '1px solid var(--db-border)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{CATEGORY_EMOJI[row.category] || '❗'}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit', color: CATEGORY_COLOR[row.category] || '#64748B' }}>{row.percentage}%</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--db-text-3)', textTransform: 'capitalize' }}>{row.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ══════════════ NGOs ══════════════
// Backed by GET /ngos (see backend/src/controllers/ngo.controller.js).
export function NGOsPage() {
  const [city, setCity] = useState('')
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listNGOs({ city: city || undefined })
      .then((results) => { if (!cancelled) setNgos(results || []) })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Could not load NGOs. Is the backend running?') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [city])

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🏢 NGOs</h1>
          <p className="db-page-subtitle">Registered organizations on SevaSathi</p>
        </div>
      </div>

      <div className="db-card db-animate db-animate-1">
        <div className="db-card-header">
          <div className="db-card-title">Search NGOs</div>
          <div className="db-search-bar" style={{ maxWidth: '220px', height: '34px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search by city…" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        {error && <div className="role-error" style={{ margin: '16px 20px 0' }}>{error}</div>}

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}

          {!loading && !error && ngos.length === 0 && (
            <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>No NGOs found yet.</div>
          )}

          {!loading && ngos.map((n) => (
            <div key={n._id} style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '1.6rem', width: '44px', height: '44px', background: 'var(--db-surface)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '.85rem', color: 'var(--db-text)' }}>
                  {n.orgName} {n.isVerifiedNGO && <span style={{ color: 'var(--db-green)', fontSize: '.7rem' }}>✓ Verified</span>}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '3px' }}>
                  📍 {n.city || 'City not set'} · {n.orgType?.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
