import React from 'react'

const IMPACT = [
  { n: '412',   label: '📚 Books Shared' },
  { n: '87',    label: '🩸 Blood Requests Fulfilled' },
  { n: '2,100', label: '🍱 Meals Distributed' },
  { n: '340',   label: '👶 Children Tutored' },
]

export default function ImpactSection() {
  return (
    <section className="impact-section">
      <div className="section-inner">
        <span className="eyebrow">Our Impact</span>
        <h2 className="section-heading">Every Number Is a Life Touched</h2>
        <p className="section-lead">SevaSathi is growing — and so is the real impact on communities across India.</p>
        <div className="impact-grid">
          {IMPACT.map((item, i) => (
            <div className="impact-cell" key={i}>
              <span className="impact-n">{item.n}</span>
              <span className="impact-label">{item.label}</span>
            </div>
          ))}
        </div>
        <a href="#" className="btn-outline-white">Join &amp; Make an Impact Today →</a>
      </div>
    </section>
  )
}
