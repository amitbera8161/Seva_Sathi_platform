import React from 'react'

const LOCAL_CARDS = [
  { icon: '🩸', num: 3,  label: 'Blood Requests Nearby',  desc: 'Urgent requests within 5 km of your location' },
  { icon: '📚', num: 7,  label: 'Books Available Now',    desc: 'Free books waiting for a student near you' },
  { icon: '📅', num: 2,  label: 'Upcoming Events',        desc: 'Food drive & clothes distribution this week' },
  { icon: '👩‍🏫', num: 12, label: 'Tutors Available',       desc: 'Free coaching volunteers ready to help children' },
]

export default function LocalSection() {
  return (
    <section className="section local-section">
      <div className="section-inner">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="eyebrow">Hyper-Local</span>
          <h2 className="section-heading">Built for Your Area</h2>
          <p className="section-lead">Pincode-matched so help always comes from your neighbourhood — not a stranger miles away.</p>
        </div>
        <div className="local-grid">
          {LOCAL_CARDS.map((c, i) => (
            <div className="local-card" key={i}>
              <div className="lc-icon">{c.icon}</div>
              <div className="lc-num">{c.num}</div>
              <div className="lc-label">{c.label}</div>
              <div className="lc-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
