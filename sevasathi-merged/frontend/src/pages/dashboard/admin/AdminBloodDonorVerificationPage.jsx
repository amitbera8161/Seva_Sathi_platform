import React, { useCallback, useEffect, useState } from 'react'
import { fetchPendingDonorVerifications, verifyBloodDonor } from '../../../services/bloodDonorService.js'

// Wires up the "✓ Verified" badge that BloodNetworkPage has always been
// able to display (blooddonor.model.js#isVerifiedDonor) but that nothing
// could ever actually set — there was no admin route or UI for it.
// Mirrors AdminNGOVerificationPage's layout and flow.
export default function AdminBloodDonorVerificationPage() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchPendingDonorVerifications()
      .then((results) => setDonors(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load pending donors. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleVerify(id) {
    setActingId(id)
    try {
      await verifyBloodDonor(id)
      setDonors((prev) => prev.filter((d) => d._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify this donor.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🩸 Blood Donor Verification</h1>
          <p className="db-page-subtitle">Review and approve donors for the "Verified" badge shown in the Blood Network</p>
        </div>
      </div>

      <div className="db-card db-animate db-animate-1">
        <div className="db-card-header">
          <div className="db-card-title">Pending Review ({donors.length})</div>
        </div>

        {error && <div className="role-error" style={{ margin: '16px 20px 0' }}>{error}</div>}

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}

          {!loading && !error && donors.length === 0 && (
            <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>No donors waiting for verification right now.</div>
          )}

          {!loading && donors.map((d) => (
            <div key={d._id} style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '.9rem', fontWeight: '800', width: '44px', height: '44px', background: 'var(--db-red-light)', color: 'var(--db-red)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {d.bloodGroup}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: '600', fontSize: '.85rem', color: 'var(--db-text)' }}>{d.user?.fullName || 'Unknown donor'}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '3px' }}>
                  {d.user?.phone || 'No phone on file'} · {d.city || 'City not set'}{d.pincode ? ` · ${d.pincode}` : ''}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--db-text-4)', marginTop: '3px' }}>
                  {d.totalDonations || 0} donation(s) on record · {d.availableForEmergency ? 'Willing for emergencies' : 'Not emergency-available'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleVerify(d._id)}
                  disabled={actingId === d._id}
                  style={{ background: 'var(--db-green)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', opacity: actingId === d._id ? 0.6 : 1 }}
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
