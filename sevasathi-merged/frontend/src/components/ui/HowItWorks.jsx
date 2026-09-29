import React from 'react'

const STEPS = [
  { n: 'Step 01', icon: '📝', title: 'Register & Verify',          desc: 'Sign up with your phone number. Get verified. Choose your role — helper, donor, or someone in need.' },
  { n: 'Step 02', icon: '🙋', title: 'Request or Offer Help',      desc: 'Post what you need or what you can give. Our system matches you with the nearest verified person instantly.' },
  { n: 'Step 03', icon: '🤝', title: 'Community Responds',         desc: 'Get help from trusted locals fast. Rate each interaction to keep the community safe and accountable.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="section how-section">
      <div className="section-inner">
        <div className="how-header">
          <span className="eyebrow">Simple Process</span>
          <h2 className="section-heading">How SevaSathi Works</h2>
          <p className="section-lead">Three steps to give or receive help. Verified, safe, always local.</p>
        </div>
        <div className="how-grid">
          {STEPS.map((s, i) => (
            <div className="how-step" key={i}>
              <div className="step-circle">
                <span className="step-n">{s.n}</span>
                <span className="step-icon">{s.icon}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
