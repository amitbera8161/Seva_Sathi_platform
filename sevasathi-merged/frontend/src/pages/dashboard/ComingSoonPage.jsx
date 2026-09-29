import React from 'react'

// Some nav items in the spec (Events/Campaigns, User Management, fraud
// detection, etc.) belong to Phase 2 — their backend doesn't exist yet.
// Rather than hide those menu items or fake data for them, this renders
// an honest placeholder so the dashboard shape is correct now and the
// page just needs to be swapped in once the feature lands.
export function makeComingSoonPage(title, description) {
  return function ComingSoonPage() {
    return (
      <div>
        <div className="db-page-header">
          <h1 className="db-page-title">{title}</h1>
        </div>
        <div className="db-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚧</div>
          <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--db-text)', marginBottom: '6px' }}>
            Coming in a future phase
          </div>
          {description && (
            <div style={{ fontSize: '.8rem', color: 'var(--db-text-3)', maxWidth: '420px', margin: '0 auto' }}>
              {description}
            </div>
          )}
        </div>
      </div>
    )
  }
}
