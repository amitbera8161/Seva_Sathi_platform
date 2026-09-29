import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { fetchCurrentUser, updateMyProfile } from '../../services/authService.js'
import { registerAsBloodDonor } from '../../services/bloodDonorService.js'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--db-border)',
  borderRadius: '8px',
  background: 'var(--db-bg)',
  color: 'var(--db-text)',
  fontSize: '.83rem',
  fontFamily: 'inherit',
  outline: 'none',
}

const readOnlyStyle = {
  ...inputStyle,
  color: 'var(--db-text-3)',
  cursor: 'not-allowed',
}

const EMPTY = { fullName: '', email: '', phone: '', city: '' }

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // "Become a donor" — only relevant if the user doesn't already hold the
  // 'blood_donor' role. Registering here (instead of only at signup) closes
  // a gap: previously the only way to create a donor profile was during
  // initial RegisterPage flow.
  const isBloodDonor = !!user?.roles?.includes('blood_donor')
  const [donorForm, setDonorForm] = useState({ bloodGroup: 'O+', city: '', pincode: '', availableForEmergency: false })
  const [donorRegistering, setDonorRegistering] = useState(false)
  const [donorError, setDonorError] = useState('')
  const [donorSuccess, setDonorSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((u) => {
        if (cancelled) return
        setForm({
          fullName: u.fullName || '',
          email: u.email || '',
          phone: u.phone || '',
          city: u.city || '',
        })
        setDonorForm((f) => ({ ...f, city: u.city || '' }))
      })
      .catch(() => setError('Could not load your profile. Please refresh and try again.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await updateMyProfile({ fullName: form.fullName, city: form.city })
      setForm((f) => ({ ...f, fullName: updated.fullName || '', city: updated.city || '' }))
      updateUser({ fullName: updated.fullName, city: updated.city })
      setSaved(true)
    } catch {
      setError('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleBecomeDonor(e) {
    e.preventDefault()
    setDonorError('')
    if (!donorForm.bloodGroup) {
      setDonorError('Please select your blood group.')
      return
    }
    setDonorRegistering(true)
    try {
      await registerAsBloodDonor({
        bloodGroup: donorForm.bloodGroup,
        availableForEmergency: donorForm.availableForEmergency,
        city: donorForm.city,
        pincode: donorForm.pincode,
      })
      // The backend already persisted the 'blood_donor' role — sync it
      // locally so the sidebar/dashboard-routing picks it up right away.
      updateUser({ roles: [...(user?.roles || []), 'blood_donor'] })
      setDonorSuccess(true)
    } catch (err) {
      setDonorError(err.response?.data?.message || 'Could not register as a blood donor.')
    } finally {
      setDonorRegistering(false)
    }
  }

  return (
    <div>
      <div className="db-page-header">
        <h1 className="db-page-title">⚙️ Settings</h1>
      </div>
      <div className="db-card" style={{ padding: '24px', maxWidth: '500px' }}>
        <div style={{ fontSize: '.9rem', fontWeight: '600', color: 'var(--db-text)', marginBottom: '16px' }}>
          Profile Settings
        </div>

        {loading && (
          <div style={{ fontSize: '.82rem', color: 'var(--db-text-3)', marginBottom: '14px' }}>Loading your profile…</div>
        )}
        {error && <div className="role-error" style={{ marginBottom: '14px' }}>{error}</div>}
        {saved && (
          <div style={{ fontSize: '.8rem', color: 'var(--db-green)', fontWeight: '600', marginBottom: '14px' }}>
            ✓ Changes saved
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
            Full Name
          </label>
          <input
            style={inputStyle}
            placeholder="Enter full name"
            value={form.fullName}
            disabled={loading}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          {/* Read-only: backend does not allow email to be changed via /users/me
              (see user.service.js#updateProfile) — it's an identity field set
              at signup/verification. */}
          <input style={readOnlyStyle} value={form.email} disabled readOnly />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
            Phone
          </label>
          {/* Read-only for the same reason as Email above. */}
          <input style={readOnlyStyle} value={form.phone || '—'} disabled readOnly />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
            City
          </label>
          <input
            style={inputStyle}
            placeholder="Enter city"
            value={form.city}
            disabled={loading}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || saving}
          style={{
            background: 'var(--db-blue)', color: 'white', border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '.82rem', fontWeight: '600',
            cursor: loading || saving ? 'default' : 'pointer', fontFamily: 'inherit',
            opacity: loading || saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {!isBloodDonor && (
        <div className="db-card" style={{ padding: '24px', maxWidth: '500px', marginTop: '20px' }}>
          <div style={{ fontSize: '.9rem', fontWeight: '600', color: 'var(--db-text)', marginBottom: '6px' }}>
            🩸 Become a Blood Donor
          </div>
          <p style={{ fontSize: '.8rem', color: 'var(--db-text-3)', marginTop: 0, marginBottom: '16px' }}>
            Register once to appear in the Blood Network and get matched to nearby requests.
          </p>

          {donorError && <div className="role-error" style={{ marginBottom: '14px' }}>{donorError}</div>}
          {donorSuccess ? (
            <div style={{ fontSize: '.82rem', color: 'var(--db-green)', fontWeight: '600' }}>
              ✓ You're now a registered blood donor.{' '}
              <button
                onClick={() => navigate('/dashboard')}
                style={{ background: 'none', border: 'none', color: 'var(--db-blue-2)', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}
              >
                Go to your Volunteer dashboard
              </button>{' '}
              to manage your donor profile.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
                  Blood Group
                </label>
                <select
                  style={inputStyle}
                  value={donorForm.bloodGroup}
                  onChange={(e) => setDonorForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                >
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '.75rem', fontWeight: '500', color: 'var(--db-text-3)', display: 'block', marginBottom: '5px' }}>
                  Pincode
                </label>
                <input
                  style={inputStyle}
                  placeholder="6-digit pincode"
                  value={donorForm.pincode}
                  onChange={(e) => setDonorForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.8rem', color: 'var(--db-text-2)' }}>
                <input
                  type="checkbox"
                  checked={donorForm.availableForEmergency}
                  onChange={(e) => setDonorForm((f) => ({ ...f, availableForEmergency: e.target.checked }))}
                />
                I am willing to be contacted for emergency requests
              </label>
              <button
                onClick={handleBecomeDonor}
                disabled={donorRegistering}
                style={{
                  background: 'var(--db-red)', color: 'white', border: 'none', borderRadius: '8px',
                  padding: '10px 20px', fontSize: '.82rem', fontWeight: '600', alignSelf: 'flex-start',
                  cursor: donorRegistering ? 'default' : 'pointer', fontFamily: 'inherit',
                  opacity: donorRegistering ? 0.7 : 1,
                }}
              >
                {donorRegistering ? 'Registering…' : 'Register as Blood Donor'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
