import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatDate.js'
import {
  searchBooks, donateBook, fetchMyBooks, setBookAvailability, requestBook,
  fetchMyBookRequests, fetchIncomingBookRequests, listAllBookRequests,
  approveBookRequest, rejectBookRequest, collectBookRequest, completeBookRequest, cancelBookRequest,
} from '../../services/bookService.js'

// Backed by /books and /book-requests (see backend/src/controllers/book.controller.js
// and bookrequest.controller.js). Lifecycle: available (on the listing) ->
// requested -> approved -> collected -> completed, with rejected/cancelled/
// unavailable as side branches — see BookRequest.status.

const CATEGORIES = [
  { value: 'textbook', label: 'Textbook' },
  { value: 'competitive_exam', label: 'Competitive Exam' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'non_fiction', label: 'Non-fiction' },
  { value: 'children', label: 'Children' },
  { value: 'reference', label: 'Reference' },
  { value: 'other', label: 'Other' },
]
const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
]
const LANGUAGES = [
  'english', 'hindi', 'bengali', 'tamil', 'telugu', 'marathi',
  'gujarati', 'kannada', 'malayalam', 'punjabi', 'urdu', 'other',
].map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }))

const CATEGORY_EMOJI = {
  textbook: '📘', competitive_exam: '📝', fiction: '📖', non_fiction: '📗',
  children: '🧸', reference: '📚', other: '📕',
}

const REQUEST_STATUS_META = {
  requested: { label: 'Requested', color: 'var(--db-amber)', bg: 'var(--db-yellow-bg)' },
  approved: { label: 'Approved', color: 'var(--db-blue-2)', bg: 'var(--db-mist)' },
  rejected: { label: 'Rejected', color: 'var(--db-ember)', bg: 'var(--db-red-light)' },
  collected: { label: 'Collected', color: 'var(--db-blue-2)', bg: 'var(--db-mist)' },
  completed: { label: 'Completed', color: 'var(--db-green)', bg: 'var(--db-green-bg)' },
  cancelled: { label: 'Cancelled', color: 'var(--db-text-3)', bg: 'var(--db-border)' },
  unavailable: { label: 'Unavailable', color: 'var(--db-text-3)', bg: 'var(--db-border)' },
}

const EMPTY_DONATE_FORM = {
  title: '', author: '', isbn: '', category: 'other', language: 'english', condition: 'good',
  quantity: 1, description: '', city: '', pincode: '',
}

const btnStyle = (bg, color = 'white') => ({
  background: bg, color, border: 'none', borderRadius: '8px', padding: '7px 14px',
  fontSize: '.76rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
})
const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px',
  background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit',
}
const tabBtnStyle = (active) => ({
  background: active ? 'var(--db-mist)' : 'transparent',
  color: active ? 'var(--db-blue)' : 'var(--db-text-3)',
  border: `1px solid ${active ? 'var(--db-blue-3)' : 'var(--db-border)'}`,
  borderRadius: '8px', padding: '7px 14px', fontSize: '.78rem', fontWeight: '600',
  cursor: 'pointer', fontFamily: 'inherit',
})

function StatusBadge({ status }) {
  const m = REQUEST_STATUS_META[status] || REQUEST_STATUS_META.requested
  return (
    <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: '10px', fontSize: '.68rem', fontWeight: '700' }}>
      {m.label}
    </span>
  )
}

function categoryLabel(v) { return CATEGORIES.find((c) => c.value === v)?.label || 'Other' }
function conditionLabel(v) { return CONDITIONS.find((c) => c.value === v)?.label || v }

// ══════════════ SHARED: request lifecycle row ══════════════
function RequestRow({ req, children }) {
  return (
    <div className="db-card" style={{ padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'var(--db-mist)', color: 'var(--db-blue-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
        {CATEGORY_EMOJI[req.book?.category] || '📕'}
      </div>
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '.88rem', color: 'var(--db-text)' }}>{req.book?.title || 'Book'}</span>
          <StatusBadge status={req.status} />
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--db-text-2)', marginTop: '4px' }}>
          Qty {req.quantityRequested} · Donor: {req.donor?.fullName || '—'} · Beneficiary: {req.beneficiary?.fullName || '—'}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '4px' }}>⏱ {timeAgo(req.createdAt)}</div>
        {req.message && <div style={{ fontSize: '.76rem', color: 'var(--db-text-3)', marginTop: '4px' }}>💬 "{req.message}"</div>}
        {req.donorNote && <div style={{ fontSize: '.76rem', color: 'var(--db-text-3)', marginTop: '2px' }}>🗒 Donor note: "{req.donorNote}"</div>}
        {req.cancelReason && req.status === 'cancelled' && (
          <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '2px' }}>Reason: {req.cancelReason}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}

// ══════════════ BROWSE & REQUEST ══════════════
function BrowseSection() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [language, setLanguage] = useState('')
  const [condition, setCondition] = useState('')
  const [city, setCity] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(null)
  const [requested, setRequested] = useState([])
  const [msgDrafts, setMsgDrafts] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    searchBooks({
      q: q || undefined, category: category || undefined, language: language || undefined,
      condition: condition || undefined, city: city || undefined, availableOnly: true,
    })
      .then((results) => setBooks(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load books. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [q, category, language, condition, city])

  useEffect(() => { load() }, [load])

  async function handleRequest(bookId) {
    setRequesting(bookId)
    setError('')
    try {
      await requestBook(bookId, { quantity: 1, message: msgDrafts[bookId] || '' })
      setRequested((p) => [...p, bookId])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send this request.')
    } finally {
      setRequesting(null)
    }
  }

  return (
    <div>
      <div className="db-card db-animate" style={{ padding: '16px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by title, author, or ISBN…" value={q}
          onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle}>
          <option value="">Any condition</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && books.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No books match this search yet.</div>
      )}

      <div className="db-resource-grid db-animate db-animate-2" style={{ padding: 0 }}>
        {books.map((b) => {
          const alreadyRequested = requested.includes(b._id)
          return (
            <div className="db-resource-card" key={b._id}>
              <div className="db-resource-img" style={{ background: 'var(--db-mist)' }}>{CATEGORY_EMOJI[b.category] || '📕'}</div>
              <div className="db-resource-body">
                <div className="db-resource-cat" style={{ color: 'var(--db-blue-2)' }}>{categoryLabel(b.category)} · {conditionLabel(b.condition)}</div>
                <div className="db-resource-title">{b.title}</div>
                {b.author && <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '2px' }}>by {b.author}</div>}
                <div className="db-resource-loc">👤 {b.donor?.fullName || 'Someone'} · 📍 {b.city || 'City not set'}</div>
                <div style={{ fontSize: '.65rem', fontWeight: '600', color: 'var(--db-emerald)', marginTop: '6px' }}>
                  ● {b.availableQuantity} of {b.quantity} available
                </div>
                {!alreadyRequested && (
                  <input
                    type="text" placeholder="Message to donor (optional)" value={msgDrafts[b._id] || ''}
                    onChange={(e) => setMsgDrafts((d) => ({ ...d, [b._id]: e.target.value }))}
                    style={{ ...inputStyle, width: '100%', marginTop: '8px', padding: '6px 10px', fontSize: '.72rem' }}
                  />
                )}
                <button
                  className="db-resource-btn"
                  onClick={() => handleRequest(b._id)}
                  disabled={requesting === b._id || alreadyRequested}
                  style={{
                    background: alreadyRequested ? 'var(--db-emerald-bg)' : 'var(--db-mist)',
                    color: alreadyRequested ? 'var(--db-emerald)' : 'var(--db-blue-2)',
                    marginTop: '8px', cursor: alreadyRequested ? 'default' : 'pointer',
                  }}
                >
                  {alreadyRequested ? '✓ Requested' : requesting === b._id ? 'Sending…' : 'Request This Book'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════ DONATE ══════════════
function DonateSection() {
  const [form, setForm] = useState(EMPTY_DONATE_FORM)
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState('')
  const [myBooks, setMyBooksList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchMyBooks()
      .then((results) => setMyBooksList(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your listings. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) {
      setFormError('Book title is required.')
      return
    }
    setPosting(true)
    try {
      await donateBook({ ...form, quantity: Number(form.quantity) || 1 })
      setForm(EMPTY_DONATE_FORM)
      await load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not list this book.')
    } finally {
      setPosting(false)
    }
  }

  async function toggleAvailability(book) {
    setToggling(book._id)
    setError('')
    try {
      await setBookAvailability(book._id, !book.isActive)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this listing.')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="db-card db-animate" style={{ padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {formError && <div className="role-error">{formError}</div>}
        <input type="text" placeholder="Book title *" value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Author" value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="ISBN (optional)" value={form.isbn}
            onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} style={inputStyle}>
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} style={inputStyle}>
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="number" min="1" max="100" value={form.quantity} placeholder="Qty"
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} style={{ ...inputStyle, width: '90px' }} />
        </div>
        <textarea placeholder="Description (edition, syllabus, notes on condition…)" rows={2} value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="City" value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
          <input type="text" placeholder="Pincode" value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <button type="submit" disabled={posting} style={{ ...btnStyle('var(--db-green)'), alignSelf: 'flex-start', opacity: posting ? 0.7 : 1 }}>
          {posting ? 'Listing…' : '+ List This Book'}
        </button>
      </form>

      <h3 style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--db-text)', margin: '0 0 10px' }}>My Listings</h3>
      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && myBooks.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>You haven't listed any books yet.</div>
      )}

      <div className="db-resource-grid db-animate db-animate-2" style={{ padding: 0 }}>
        {myBooks.map((b) => (
          <div className="db-resource-card" key={b._id}>
            <div className="db-resource-img" style={{ background: 'var(--db-mist)' }}>{CATEGORY_EMOJI[b.category] || '📕'}</div>
            <div className="db-resource-body">
              <div className="db-resource-cat" style={{ color: 'var(--db-blue-2)' }}>{categoryLabel(b.category)} · {conditionLabel(b.condition)}</div>
              <div className="db-resource-title">{b.title}</div>
              <div style={{ fontSize: '.65rem', fontWeight: '600', color: b.status === 'available' ? 'var(--db-emerald)' : 'var(--db-text-4)', marginTop: '6px' }}>
                {b.status === 'available' ? `● ${b.availableQuantity}/${b.quantity} available` : '○ Unavailable'}
              </div>
              <button
                className="db-resource-btn"
                onClick={() => toggleAvailability(b)}
                disabled={toggling === b._id}
                style={{ background: 'var(--db-border)', color: 'var(--db-text-2)', marginTop: '8px' }}
              >
                {toggling === b._id ? '…' : b.isActive ? 'Pause Listing' : 'Resume Listing'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════ MY REQUESTS (beneficiary) ══════════════
function MyRequestsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchMyBookRequests()
      .then((results) => setItems(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your requests. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id, fn) {
    setActing(id)
    setError('')
    try {
      await fn(id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'That action could not be completed.')
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>You haven't requested any books yet.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="db-animate db-animate-3">
        {items.map((req) => {
          const isBusy = acting === req._id
          return (
            <RequestRow key={req._id} req={req}>
              {req.status === 'approved' && (
                <button disabled={isBusy} style={btnStyle('var(--db-blue-2)')} onClick={() => act(req._id, collectBookRequest)}>
                  {isBusy ? '…' : 'Mark Collected'}
                </button>
              )}
              {req.status === 'collected' && (
                <button disabled={isBusy} style={btnStyle('var(--db-green)')} onClick={() => act(req._id, completeBookRequest)}>
                  {isBusy ? '…' : 'Mark Completed'}
                </button>
              )}
              {['requested', 'approved'].includes(req.status) && (
                <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, cancelBookRequest)}>
                  Cancel
                </button>
              )}
            </RequestRow>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════ INCOMING REQUESTS (donor) ══════════════
function IncomingRequestsSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchIncomingBookRequests()
      .then((results) => setItems(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load requests. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id, fn) {
    setActing(id)
    setError('')
    try {
      await fn(id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'That action could not be completed.')
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No one has requested your books yet.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="db-animate db-animate-3">
        {items.map((req) => {
          const isBusy = acting === req._id
          return (
            <RequestRow key={req._id} req={req}>
              {req.status === 'requested' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button disabled={isBusy} style={btnStyle('var(--db-green)')} onClick={() => act(req._id, approveBookRequest)}>
                    {isBusy ? '…' : 'Approve'}
                  </button>
                  <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, rejectBookRequest)}>
                    Reject
                  </button>
                </div>
              )}
              {req.status === 'approved' && (
                <button disabled={isBusy} style={btnStyle('var(--db-blue-2)')} onClick={() => act(req._id, collectBookRequest)}>
                  {isBusy ? '…' : 'Mark Collected'}
                </button>
              )}
              {req.status === 'collected' && (
                <button disabled={isBusy} style={btnStyle('var(--db-green)')} onClick={() => act(req._id, completeBookRequest)}>
                  {isBusy ? '…' : 'Mark Completed'}
                </button>
              )}
            </RequestRow>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════ OVERSIGHT (Volunteer/NGO/Admin) ══════════════
function OversightSection() {
  const { user } = useAuth()
  const isAdmin = !!user?.roles?.includes('admin')

  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listAllBookRequests(statusFilter === 'all' ? {} : { status: statusFilter })
      .then((results) => setItems(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load book requests. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  async function act(id, fn) {
    setActing(id)
    setError('')
    try {
      await fn(id)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'That action could not be completed.')
    } finally {
      setActing(null)
    }
  }

  const STATUSES = ['all', 'requested', 'approved', 'collected', 'completed', 'rejected', 'cancelled', 'unavailable']

  return (
    <div>
      <div className="db-filter-bar db-animate db-animate-1" style={{ padding: '0 0 16px', flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button key={s} className={`db-filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : (REQUEST_STATUS_META[s]?.label || s)}
          </button>
        ))}
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>No book requests found.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="db-animate db-animate-2">
        {items.map((req) => (
          <RequestRow key={req._id} req={req}>
            {isAdmin && ['requested', 'approved', 'collected'].includes(req.status) && (
              <button disabled={acting === req._id} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, cancelBookRequest)}>
                Cancel
              </button>
            )}
          </RequestRow>
        ))}
      </div>
    </div>
  )
}

// ══════════════ MAIN ══════════════
// mode: 'full' (Beneficiary/Volunteer — browse & request, donate, track
//       both sides of the exchange — books don't have a fixed "donor
//       role" the way blood groups fix a donor/patient split, so any
//       user can act as either), 'oversight' (NGO/Admin — platform-wide
//       read view; Admin additionally gets cancel power).
export default function BookExchangePage({ mode = 'full' }) {
  const [tab, setTab] = useState(mode === 'oversight' ? 'requests' : 'browse')

  if (mode === 'oversight') {
    return (
      <div>
        <div className="db-page-header db-animate">
          <div>
            <h1 className="db-page-title">📚 Book Exchange</h1>
            <p className="db-page-subtitle">Platform-wide view of book listings and requests</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button style={tabBtnStyle(tab === 'requests')} onClick={() => setTab('requests')}>Requests</button>
          <button style={tabBtnStyle(tab === 'browse')} onClick={() => setTab('browse')}>Book Listings</button>
        </div>
        {tab === 'requests' ? <OversightSection /> : <BrowseSection />}
      </div>
    )
  }

  const TABS = [
    { id: 'browse', label: 'Browse & Request' },
    { id: 'donate', label: 'Donate a Book' },
    { id: 'requests', label: 'My Requests' },
    { id: 'incoming', label: 'Requests on My Books' },
  ]

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">📚 Book Exchange</h1>
          <p className="db-page-subtitle">Donate books you no longer need, or find ones you do</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.id} style={tabBtnStyle(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'browse' && <BrowseSection />}
      {tab === 'donate' && <DonateSection />}
      {tab === 'requests' && <MyRequestsSection />}
      {tab === 'incoming' && <IncomingRequestsSection />}
    </div>
  )
}
