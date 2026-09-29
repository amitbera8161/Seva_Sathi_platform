import React from 'react'

const PARTNERS = [
  { icon: '🏥', name: 'City Hospital' },
  { icon: '🎓', name: 'ABC College' },
  { icon: '🤝', name: 'Helping Hands NGO' },
  { icon: '🏫', name: 'NSS Unit — Jadavpur' },
  { icon: '🌿', name: 'GreenCare Foundation' },
  { icon: '📦', name: 'BookBridge India' },
]

export default function Partners() {
  return (
    <section id="about" className="partners-section">
      <div className="partners-inner">
        <div className="partners-header">
          <span className="eyebrow">Trusted By</span>
          <h2 className="section-heading">Our Partners</h2>
        </div>
        <div className="partners-row">
          {PARTNERS.map((p, i) => (
            <div className="partner-pill" key={i}>
              <span>{p.icon}</span> {p.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
