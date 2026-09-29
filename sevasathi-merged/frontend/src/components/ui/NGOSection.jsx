import React from 'react'

const NGO_PANELS = [
  { icon: '🏥', title: 'Hospitals',        desc: 'Blood & medicine coordination at scale' },
  { icon: '🎓', title: 'Colleges',         desc: 'NSS units & student volunteers' },
  { icon: '🏛️', title: 'NGOs',             desc: 'Verified impact organizations' },
  { icon: '🤲', title: 'Community Groups', desc: 'Mohalla clubs & local bodies' },
]

const NGO_LIST = [
  'Verified NGO badge trusted by the community',
  'Post events and recruit local volunteers instantly',
  'Manage food drives, blood camps & resource collections',
  'Track your organization\'s real-time social impact',
  'Connect with other NGOs and government bodies',
]

export default function NGOSection() {
  return (
    <section id="ngo" className="section ngo-section">
      <div className="ngo-inner">
        <div className="ngo-text">
          <span className="eyebrow">For Organizations</span>
          <h2 className="section-heading">Register Your NGO or NSS Chapter</h2>
          <p>SevaSathi gives NGOs, NSS volunteers, and student organizations a powerful platform to coordinate, recruit, and amplify their social impact — completely free.</p>
          <ul className="ngo-list">
            {NGO_LIST.map((item, i) => (
              <li key={i}><span className="check-icon">✓</span> {item}</li>
            ))}
          </ul>
          <a href="#" className="btn-jade">Register Your Organization →</a>
        </div>
        <div className="ngo-panels">
          {NGO_PANELS.map((p, i) => (
            <div className="ngo-panel" key={i}>
              <div className="p-icon">{p.icon}</div>
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
