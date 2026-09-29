import React, { useCallback, useEffect, useState } from 'react'
import {
  fetchMyBloodDonorProfile,
  registerAsBloodDonor,
  updateMyBloodDonorProfile,
  recordBloodDonation,
} from '../../services/bloodDonorService.js'
import { useAuth } from '../../context/AuthContext.jsx'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const btnStyle = (bg, color = 'white') => ({
  background: bg, color, border: 'none', borderRadius: '8px', padding: '9px 16px',
  fontSize: '.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
})
const inputStyle = {
  padding: '9px 12px', border: '1px solid var(--db-border)', borderRadius: '8px',
  background: 'var(--db-bg)', color: 'var(--db-text)', fontSize: '.82rem', fontFamily: 'inherit',
  width: '100%',
}
const labelStyle = {
  fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// This page exists to close a gap: the backend has had GET/PATCH
// /blood-donors/me and POST /blood-donors/me/donations since Phase 2, but
// nothing in the frontend ever called them. Donors could register at
// signup and then never see or change their profile again, and could
// never log a donation given outside the platform's own matching flow.
export default function MyBloodDonorProfilePage() {
  const { user, updateUser } = useAuth()

  const [donor, setDonor] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [regForm, setRegForm] = useState({ bloodGroup: 'O+', city: '', pincode: '', availableForEmergency: false, lastDonationDate: '' })
  const [registering, setRegistering] = useState(false)
  const [regError, setRegError] = useState('')

  const [loggingDonation, setLoggingDonation] = useState(false)
  const [donationDate, setDonationDate] = useState('')
  const [donationSaving, setDonationSaving] = useState(false)
  const [donationError, setDonationError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    setNotFound(false)
    fetchMyBloodDonorProfile()
      .then((d) => setDonor(d))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true)
        else setError(err.response?.data?.message || 'Could not load your donor profile.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (donor) {
      setForm({
        bloodGroup: donor.bloodGroup,
        availableForEmergency: !!donor.availableForEmergency,
        city: donor.city || '',
        pincode: donor.pincode || '',
      })
    }
  }, [donor])

  async function handleRegister(e) {
    e.preventDefault()
    setRegError('')
    if (!regForm.bloodGroup) {
      setRegError('Please select your blood group.')
      return
    }
    setRegistering(true)
    try {
      const created = await registerAsBloodDonor({
        bloodGroup: regForm.bloodGroup,
        lastDonationDate: regForm.lastDonationDate || undefined,
        availableForEmergency: regForm.availableForEmergency,
        city: regForm.city,
        pincode: regForm.pincode,
      })
      setDonor(created)
      setNotFound(false)
      // The backend already added the 'blood_donor' role — keep the local
      // user object in sync so role-gated UI (e.g. this very tab) reflects
      // it immediately without needing a re-login.
      if (user && !user.roles?.includes('blood_donor')) {
        updateUser({ roles: [...(user.roles || []), 'blood_donor'] })
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Could not create your donor profile.')
    } finally {
      setRegistering(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      const updated = await updateMyBloodDonorProfile(form)
      setDonor(updated)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogDonation(e) {
    e.preventDefault()
    setDonationError('')
    setDonationSaving(true)
    try {
      const updated = await recordBloodDonation(donationDate || undefined)
      setDonor(updated)
      setLoggingDonation(false)
      setDonationDate('')
    } catch (err) {
      setDonationError(err.response?.data?.message || 'Could not log this donation.')
    } finally {
      setDonationSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading your donor profile…</div>
  }

  // ---- No profile yet: "become a donor" form ----
  if (notFound) {
    return (
      <div>
        <div className="db-page-header db-animate">
          <div>
            <h1 className="db-page-title">🩸 Become a Blood Donor</h1>
            <p className="db-page-subtitle">Add your blood donor profile so patients nearby can find and match with you</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="db-card db-animate" style={{ padding: '18px', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {regError && <div className="role-error">{regError}</div>}

          <div>
            <label style={labelStyle}>Blood Group</label>
            <select style={inputStyle} value={regForm.bloodGroup} onChange={(e) => setRegForm((f) => ({ ...f, bloodGroup: e.target.value }))}>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input style={inputStyle} value={regForm.city} onChange={(e) => setRegForm((f) => ({ ...f, city: e.target.value }))} placeholder="Your city" />
          </div>
          <div>
            <label style={labelStyle}>Pincode</label>
            <input style={inputStyle} value={regForm.pincode} onChange={(e) => setRegForm((f) => ({ ...f, pincode: e.target.value }))} placeholder="6-digit pincode" />
          </div>
          <div>
            <label style={labelStyle}>Last Donation Date (optional)</label>
            <input type="date" style={inputStyle} value={regForm.lastDonationDate} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setRegForm((f) => ({ ...f, lastDonationDate: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.82rem', color: 'var(--db-text-2)' }}>
            <input type="checkbox" checked={regForm.availableForEmergency}
              onChange={(e) => setRegForm((f) => ({ ...f, availableForEmergency: e.target.checked }))} />
            I am willing to be contacted for emergency requests
          </label>

          <button type="submit" disabled={registering} style={{ ...btnStyle('var(--db-red)'), alignSelf: 'flex-start', opacity: registering ? 0.7 : 1 }}>
            {registering ? 'Submitting…' : 'Register as a Blood Donor'}
          </button>
        </form>
      </div>
    )
  }

  if (!donor) {
    return <div className="role-error" style={{ margin: '16px 0' }}>{error || 'Could not load your donor profile.'}</div>
  }

  const eligibleNow = !donor.nextEligibleDate || new Date(donor.nextEligibleDate) <= new Date()

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🩸 My Donor Profile</h1>
          <p className="db-page-subtitle">Manage your blood donor details and donation history</p>
        </div>
      </div>

      {error && <div className="role-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {saved && <div style={{ fontSize: '.8rem', color: 'var(--db-green)', fontWeight: '600', marginBottom: '14px' }}>✓ Changes saved</div>}

      <div className="db-card db-animate db-animate-1" style={{ padding: '20px', maxWidth: '560px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '.9rem', fontWeight: '600', color: 'var(--db-text)' }}>Profile</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {donor.isVerifiedDonor
              ? <span className="db-donor-badge">✓ Verified</span>
              : <span style={{ fontSize: '.68rem', padding: '3px 8px', borderRadius: '10px', background: 'var(--db-border)', color: 'var(--db-text-3)', fontWeight: '600' }}>Verification pending</span>}
            {!editing && (
              <button onClick={() => { setEditing(true); setSaved(false) }} style={btnStyle('var(--db-mist)', 'var(--db-blue-2)')}>Edit</button>
            )}
          </div>
        </div>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '.84rem', color: 'var(--db-text-2)' }}>
            <div><strong style={{ color: 'var(--db-text)' }}>Blood Group:</strong> {donor.bloodGroup}</div>
            <div><strong style={{ color: 'var(--db-text)' }}>City:</strong> {donor.city || '—'}</div>
            <div><strong style={{ color: 'var(--db-text)' }}>Pincode:</strong> {donor.pincode || '—'}</div>
            <div><strong style={{ color: 'var(--db-text)' }}>Emergency Availability:</strong> {donor.availableForEmergency ? 'Willing to be contacted' : 'Not available'}</div>
            <div><strong style={{ color: 'var(--db-text)' }}>Total Donations:</strong> {donor.totalDonations || 0}</div>
            <div><strong style={{ color: 'var(--db-text)' }}>Last Donation:</strong> {formatDate(donor.lastDonationDate)}</div>
            <div>
              <strong style={{ color: 'var(--db-text)' }}>Next Eligible Date:</strong>{' '}
              {donor.nextEligibleDate
                ? <span style={{ color: eligibleNow ? 'var(--db-green)' : 'var(--db-amber)' }}>{formatDate(donor.nextEligibleDate)}{eligibleNow ? ' (eligible now)' : ''}</span>
                : <span style={{ color: 'var(--db-green)' }}>Eligible now (no prior donation on record)</span>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Blood Group</label>
              <select style={inputStyle} value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Pincode</label>
              <input style={inputStyle} value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.82rem', color: 'var(--db-text-2)' }}>
              <input type="checkbox" checked={form.availableForEmergency}
                onChange={(e) => setForm((f) => ({ ...f, availableForEmergency: e.target.checked }))} />
              I am willing to be contacted for emergency requests
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving} style={{ ...btnStyle('var(--db-blue)'), opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditing(false); setForm({ bloodGroup: donor.bloodGroup, availableForEmergency: !!donor.availableForEmergency, city: donor.city || '', pincode: donor.pincode || '' }) }}
                style={btnStyle('transparent', 'var(--db-text-3)')}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="db-card db-animate db-animate-2" style={{ padding: '20px', maxWidth: '560px' }}>
        <div style={{ fontSize: '.9rem', fontWeight: '600', color: 'var(--db-text)', marginBottom: '10px' }}>Log a Donation</div>
        <p style={{ fontSize: '.78rem', color: 'var(--db-text-3)', marginTop: '-4px', marginBottom: '12px' }}>
          Donated at a camp or hospital outside a SevaSathi request? Record it here — it updates your total and resets your 90-day eligibility window.
        </p>

        {donationError && <div className="role-error" style={{ marginBottom: '12px' }}>{donationError}</div>}

        {!loggingDonation ? (
          <button onClick={() => setLoggingDonation(true)} style={btnStyle('var(--db-red)')}>+ Log a Donation</button>
        ) : (
          <form onSubmit={handleLogDonation} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={labelStyle}>Donation Date</label>
              <input type="date" style={inputStyle} value={donationDate} max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDonationDate(e.target.value)} />
            </div>
            <button type="submit" disabled={donationSaving} style={{ ...btnStyle('var(--db-red)'), opacity: donationSaving ? 0.7 : 1 }}>
              {donationSaving ? 'Saving…' : 'Confirm'}
            </button>
            <button type="button" onClick={() => { setLoggingDonation(false); setDonationDate(''); setDonationError('') }} style={btnStyle('transparent', 'var(--db-text-3)')}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
