import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { timeAgo } from '../../utils/formatDate.js'
import {
  listBloodRequests,
  createBloodRequest,
  fetchMyBloodRequests,
  fetchMyDonorMatches,
  respondToBloodRequest,
  rematchBloodRequest,
  confirmBloodDonation,
  cancelBloodRequest,
} from '../../services/bloodRequestService.js'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Plain-language versions of the backend's technical status names —
// written for someone in a stressful situation, not a developer.
const STATUS_META = {
  pending:               { label: 'Looking for a donor…',        color: 'var(--db-amber)',  bg: 'var(--db-yellow-bg)' },
  matched:               { label: 'Donors notified',              color: 'var(--db-blue-2)', bg: 'var(--db-mist)' },
  accepted:              { label: 'Some donors said yes',         color: 'var(--db-blue-2)', bg: 'var(--db-mist)' },
  in_progress:           { label: 'Donor(s) on the way',          color: 'var(--db-blue-2)', bg: 'var(--db-mist)' },
  waiting_confirmation:  { label: 'Almost done — confirming',     color: 'var(--db-amber)', bg: 'var(--db-yellow-bg)' },
  completed:             { label: 'Done — thank you! 🎉',         color: 'var(--db-green)',  bg: 'var(--db-green-bg)' },
  cancelled:             { label: 'Cancelled',                    color: 'var(--db-text-3)', bg: 'var(--db-border)' },
  expired:               { label: 'No response in time',          color: 'var(--db-text-3)', bg: 'var(--db-border)' },
}

const PRIORITY_META = {
  critical: { label: 'Very Urgent', color: 'var(--db-red)' },
  urgent:   { label: 'Urgent',      color: 'var(--db-amber)' },
  normal:   { label: 'Can Wait',    color: 'var(--db-text-3)' },
}

const EMPTY_FORM = {
  bloodGroup: 'O+', unitsRequired: 1, priority: 'urgent',
  hospitalName: '', hospitalAddress: '', city: '', pincode: '', contactPhone: '', notes: '',
}

const btnStyle = (bg, color = 'white') => ({
  background: bg, color, border: 'none', borderRadius: '8px', padding: '7px 14px',
  fontSize: '.76rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
})
const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px',
  background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit',
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return (
    <span style={{ background: m.bg, color: m.color, padding: '3px 10px', borderRadius: '10px', fontSize: '.68rem', fontWeight: '700' }}>
      {m.label}
    </span>
  )
}

function AcceptedDonorRow({ entry }) {
  const name = entry.user?.fullName || 'Donor'
  const phone = entry.user?.phone || '—'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.74rem', color: 'var(--db-text-2)', padding: '4px 0' }}>
      <span>{entry.donorConfirmedAt ? '✅' : '🩸'}</span>
      <span style={{ fontWeight: '600' }}>{name}</span>
      <span style={{ color: 'var(--db-text-3)' }}>· {phone}</span>
      {entry.eta && <span style={{ color: 'var(--db-text-3)' }}>· ETA {entry.eta}</span>}
      {entry.donorConfirmedAt && <span style={{ color: 'var(--db-green)', fontWeight: '600' }}>· Confirmed</span>}
    </div>
  )
}

function RequestCard({ req, children }) {
  const priority = PRIORITY_META[req.priority] || PRIORITY_META.urgent
  return (
    <div className="db-card" style={{ padding: '16px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'var(--db-red-light)', color: 'var(--db-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '.85rem', flexShrink: 0 }}>
        {req.bloodGroup}
      </div>
      <div style={{ flex: 1, minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '600', fontSize: '.88rem', color: 'var(--db-text)' }}>{req.hospitalName}</span>
          <StatusBadge status={req.status} />
          <span style={{ color: priority.color, fontSize: '.68rem', fontWeight: '700', textTransform: 'uppercase' }}>{priority.label}</span>
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--db-text-2)', marginTop: '4px' }}>
          {req.acceptedDonors?.length || 0}/{req.unitsRequired} unit(s) covered · {[req.hospitalAddress, req.city].filter(Boolean).join(', ') || 'Location not specified'}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '4px' }}>
          ⏱ {timeAgo(req.createdAt)} · 🤝 {req.matchedDonors?.length || 0} matched donor(s)
          {req.patient?.fullName && <> · Patient: {req.patient.fullName}</>}
        </div>
        {req.acceptedDonors?.length > 0 && (
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--db-border)' }}>
            {req.acceptedDonors.map((entry, i) => <AcceptedDonorRow key={entry.user?._id || i} entry={entry} />)}
            {req.patientConfirmedAt && <div style={{ fontSize: '.72rem', color: 'var(--db-green)', fontWeight: '600', marginTop: '2px' }}>✅ Patient confirmed</div>}
          </div>
        )}
        {req.notes && <div style={{ fontSize: '.76rem', color: 'var(--db-text-3)', marginTop: '4px' }}>{req.notes}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}

// mode: 'patient' (Beneficiary — create & track own requests),
//       'donor' (Volunteer/blood_donor — respond to matches),
//       'oversight' (NGO/Admin — platform-wide read view, admin can cancel)
export default function BloodRequestsPage({ mode = 'patient' }) {
  const { user } = useAuth()
  const isAdmin = !!user?.roles?.includes('admin')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [etaDrafts, setEtaDrafts] = useState({})

  const [showForm, setShowForm] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [posting, setPosting] = useState(false)

  const [lastUpdated, setLastUpdated] = useState(null)

  // `silent` = true for background auto-refreshes, so the list doesn't flash
  // "Loading…" every few seconds — only the first load and manual actions
  // show that state.
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    const fetcher =
      mode === 'patient' ? fetchMyBloodRequests :
      mode === 'donor' ? fetchMyDonorMatches :
      () => listBloodRequests(statusFilter === 'all' ? {} : { status: statusFilter })

    return fetcher()
      .then((results) => {
        setItems(results || [])
        setLastUpdated(new Date())
      })
      .catch((err) => {
        if (!silent) setError(err.response?.data?.message || 'We couldn\'t load your requests. Please check your connection.')
      })
      .finally(() => { if (!silent) setLoading(false) })
  }, [mode, statusFilter])

  // Initial load, plus a quiet background refresh every 8s so donor
  // responses / status changes show up without the user hitting reload —
  // this is the "real-time monitoring" the page needs for anything
  // time-critical like a blood request.
  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [load])

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.bloodGroup || !form.hospitalName.trim() || !form.city.trim() || !form.contactPhone.trim()) {
      setFormError('Please fill in blood group, hospital name, city, and a contact number — these are needed to find you a donor.')
      return
    }
    setPosting(true)
    try {
      await createBloodRequest(form)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setShowMoreDetails(false)
      await load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not create this request.')
    } finally {
      setPosting(false)
    }
  }

  async function act(id, fn, ...args) {
    setActing(id)
    setError('')
    try {
      await fn(id, ...args)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'That didn\'t go through. Please try again.')
    } finally {
      setActing(null)
    }
  }

  // ---- Actions available per row ----
  function renderActions(req) {
    const isBusy = acting === req._id
    const myMatch = req.matchedDonors?.find((m) => (m.user?._id || m.user) === user?._id)
    const myAcceptedEntry = req.acceptedDonors?.find((d) => d.user?._id === user?._id)
    const canConfirm = ['in_progress', 'waiting_confirmation'].includes(req.status)
    const canCancel = ['pending', 'matched', 'accepted', 'in_progress', 'waiting_confirmation'].includes(req.status)

    if (mode === 'donor') {
      // Not yet responded — accept (with optional ETA) or decline.
      if (myMatch?.status === 'pending' && ['pending', 'matched', 'accepted'].includes(req.status)) {
        return (
          <>
            <input
              placeholder="ETA e.g. 30 mins"
              value={etaDrafts[req._id] || ''}
              onChange={(e) => setEtaDrafts((d) => ({ ...d, [req._id]: e.target.value }))}
              style={{ ...inputStyle, padding: '6px 10px', fontSize: '.74rem', width: '140px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button disabled={isBusy} style={btnStyle('var(--db-green)')} onClick={() => act(req._id, respondToBloodRequest, 'accept', etaDrafts[req._id] || '')}>
                {isBusy ? '…' : 'Accept'}
              </button>
              <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, respondToBloodRequest, 'reject')}>
                Decline
              </button>
            </div>
          </>
        )
      }
      // I'm an accepted donor, haven't confirmed yet.
      if (myAcceptedEntry && !myAcceptedEntry.donorConfirmedAt && canConfirm) {
        return (
          <button disabled={isBusy} style={btnStyle('var(--db-blue-2)')} onClick={() => act(req._id, confirmBloodDonation)}>
            {isBusy ? '…' : 'Confirm Donation Given'}
          </button>
        )
      }
      if (myAcceptedEntry?.donorConfirmedAt) {
        return <span style={{ fontSize: '.72rem', color: 'var(--db-green)', fontWeight: '600' }}>✅ You confirmed</span>
      }
      return null
    }

    if (mode === 'patient') {
      if (canConfirm && !req.patientConfirmedAt) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <button disabled={isBusy} style={btnStyle('var(--db-blue-2)')} onClick={() => act(req._id, confirmBloodDonation)}>
              {isBusy ? '…' : 'Confirm Donation Received'}
            </button>
            {canCancel && <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, cancelBloodRequest)}>Cancel</button>}
          </div>
        )
      }
      if (req.status === 'waiting_confirmation' && req.patientConfirmedAt) {
        return <span style={{ fontSize: '.72rem', color: 'var(--db-text-3)' }}>Waiting on donor(s) to confirm…</span>
      }
      if (['pending', 'matched', 'accepted'].includes(req.status)) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            {(req.acceptedDonors?.length || 0) < req.unitsRequired && (
              <button disabled={isBusy} style={btnStyle('var(--db-mist)', 'var(--db-blue-2)')} onClick={() => act(req._id, rematchBloodRequest)}>
                {isBusy ? '…' : 'Find More Donors'}
              </button>
            )}
            <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, cancelBloodRequest)}>Cancel</button>
          </div>
        )
      }
      return null
    }

    if (mode === 'oversight' && isAdmin && canCancel) {
      return <button disabled={isBusy} style={btnStyle('transparent', 'var(--db-ember)')} onClick={() => act(req._id, cancelBloodRequest)}>Cancel</button>
    }

    return null
  }

  const title = mode === 'patient' ? '🩸 Blood Support' : mode === 'donor' ? '🩸 Blood Requests Matched to You' : '🩸 Blood Requests'
  const subtitle =
    mode === 'patient' ? 'Request blood and track donor matching in real time' :
    mode === 'donor' ? 'Respond to requests where you were matched as a donor' :
    'Platform-wide view of every blood request'

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">{title}</h1>
          <p className="db-page-subtitle">{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="db-live-badge" title={lastUpdated ? `Last checked ${lastUpdated.toLocaleTimeString()}` : ''}>
            <span className="dot" />
            Live
          </div>
          {mode === 'patient' && (
            <button onClick={() => setShowForm((s) => !s)} style={btnStyle('var(--db-red)')}>
              {showForm ? '✕ Cancel' : '+ New Blood Request'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {mode === 'patient' && showForm && (
        <form onSubmit={handleSubmit} className="db-card db-animate" style={{ padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {formError && <div className="role-error">{formError}</div>}

          <div style={{ fontSize: '.72rem', fontWeight: '700', color: 'var(--db-text-3)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
            The essentials
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} style={inputStyle}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={inputStyle}>
              <option value="critical">Very Urgent</option>
              <option value="urgent">Urgent</option>
              <option value="normal">Can Wait</option>
            </select>
          </div>
          <input type="text" placeholder="Hospital name" value={form.hospitalName}
            onChange={(e) => setForm((f) => ({ ...f, hospitalName: e.target.value }))} style={inputStyle} />
          <input type="text" placeholder="City (needed to find nearby donors)" value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} style={inputStyle} />
          <input type="text" placeholder="Your contact number" value={form.contactPhone}
            onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} style={inputStyle} />

          {!showMoreDetails ? (
            <button
              type="button"
              onClick={() => setShowMoreDetails(true)}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--db-blue-2)', fontSize: '.76rem', fontWeight: '600', cursor: 'pointer', padding: '2px 0' }}
            >
              + Add more details (optional)
            </button>
          ) : (
            <>
              <div style={{ fontSize: '.72rem', fontWeight: '700', color: 'var(--db-text-3)', textTransform: 'uppercase', letterSpacing: '.03em', marginTop: '4px' }}>
                Optional details
              </div>
              <input type="number" min="1" max="20" value={form.unitsRequired} placeholder="Units needed"
                onChange={(e) => setForm((f) => ({ ...f, unitsRequired: Number(e.target.value) }))}
                style={{ ...inputStyle, width: '140px' }} />
              <input type="text" placeholder="Hospital address" value={form.hospitalAddress}
                onChange={(e) => setForm((f) => ({ ...f, hospitalAddress: e.target.value }))} style={inputStyle} />
              <input type="text" placeholder="Pincode (helps find donors even faster)" value={form.pincode}
                onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} style={inputStyle} />
              <textarea placeholder="Anything else donors should know…" rows={2} value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
            </>
          )}

          <button type="submit" disabled={posting} style={{ ...btnStyle('var(--db-red)'), alignSelf: 'flex-start', opacity: posting ? 0.7 : 1 }}>
            {posting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      )}

      {mode === 'oversight' && (
        <div className="db-filter-bar db-animate db-animate-2" style={{ padding: '0 0 16px', flexWrap: 'wrap' }}>
          {['all', 'pending', 'matched', 'accepted', 'in_progress', 'waiting_confirmation', 'completed', 'cancelled', 'expired'].map((s) => (
            <button key={s} className={`db-filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}

      {loading && <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>
          {mode === 'patient' ? "You haven't made any blood requests yet." :
           mode === 'donor' ? "You haven't been matched to any requests yet." :
           'No blood requests found.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="db-animate db-animate-3">
        {items.map((req) => (
          <RequestCard key={req._id} req={req}>
            {renderActions(req)}
          </RequestCard>
        ))}
      </div>
    </div>
  )
}
