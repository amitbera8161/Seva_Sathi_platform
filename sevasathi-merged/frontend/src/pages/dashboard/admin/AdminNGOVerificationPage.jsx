import React, { useCallback, useEffect, useState } from 'react'
import { fetchPendingNGOs, verifyNGO, rejectNGO } from '../../../services/ngoService.js'

// Wires up the admin NGO-verification workflow that already existed on the
// backend (ngo.controller.js / ngo.service.js) but had no reachable UI —
// no frontend called it and no account could hold the 'admin' role.
export default function AdminNGOVerificationPage() {
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetchPendingNGOs()
      .then((results) => setNgos(results || []))
      .catch((err) => setError(err.response?.data?.message || 'Could not load pending NGOs. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleVerify(id) {
    setActingId(id)
    try {
      await verifyNGO(id)
      setNgos((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not verify this NGO.')
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(id) {
    setActingId(id)
    try {
      await rejectNGO(id)
      setNgos((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject this NGO.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div>
      <div className="db-page-header db-animate">
        <div>
          <h1 className="db-page-title">🛡️ NGO Verification</h1>
          <p className="db-page-subtitle">Review registration documents and approve or reject NGOs</p>
        </div>
      </div>

      <div className="db-card db-animate db-animate-1">
        <div className="db-card-header">
          <div className="db-card-title">Pending Review ({ngos.length})</div>
        </div>

        {error && <div className="role-error" style={{ margin: '16px 20px 0' }}>{error}</div>}

        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>Loading…</div>}

          {!loading && !error && ngos.length === 0 && (
            <div style={{ color: 'var(--db-text-3)', fontSize: '.85rem' }}>No NGOs waiting for review right now.</div>
          )}

          {!loading && ngos.map((n) => (
            <div key={n._id} style={{ background: 'var(--db-bg)', border: '1px solid var(--db-border)', borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '1.6rem', width: '44px', height: '44px', background: 'var(--db-surface)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏢</div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: '600', fontSize: '.85rem', color: 'var(--db-text)' }}>{n.orgName}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--db-text-3)', marginTop: '3px' }}>
                  {n.orgType?.replace(/_/g, ' ')} · Reg #{n.registrationNumber} · {n.city || 'City not set'}
                </div>
                <div style={{ fontSize: '.7rem', color: 'var(--db-text-4)', marginTop: '3px' }}>
                  Status: {n.verificationStatus} · {n.verificationDocuments?.length || 0} document(s) uploaded
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleVerify(n._id)}
                  disabled={actingId === n._id}
                  style={{ background: 'var(--db-green)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', opacity: actingId === n._id ? 0.6 : 1 }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(n._id)}
                  disabled={actingId === n._id}
                  style={{ background: 'transparent', color: 'var(--db-ember)', border: '1px solid var(--db-border)', borderRadius: '8px', padding: '8px 14px', fontSize: '.78rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', opacity: actingId === n._id ? 0.6 : 1 }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
