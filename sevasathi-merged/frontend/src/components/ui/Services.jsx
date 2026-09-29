import React from 'react'

const SERVICES = [
  { ac: '#e74c3c', bg: '#fee2e2', icon: '🩸', title: 'Blood Donor Network',      desc: 'Find verified donors by blood group, location, and last donation date. One post can save a life in minutes.',         link: 'Find a Donor →' },
  { ac: '#0d6e4f', bg: '#dcfce7', icon: '📚', title: 'Free Book Sharing',         desc: 'Donate or collect textbooks, study guides, and notebooks. No student should miss out because of cost.',               link: 'Browse Books →' },
  { ac: '#c47c00', bg: '#fef9c3', icon: '🍱', title: 'Food Assistance',           desc: 'Connect families in crisis with food donors, community kitchens, and NGOs providing daily meal support.',             link: 'Get Help →' },
  { ac: '#1e3a5f', bg: '#dbeafe', icon: '🏫', title: 'Free Tuition Support',      desc: 'NSS volunteers and student tutors offer free coaching for children who need academic support.',                         link: 'Find a Tutor →' },
  { ac: '#6d28d9', bg: '#ede9fe', icon: '💊', title: 'Medicine Help',             desc: 'Volunteers assist elderly people in getting medicines collected, delivered, and tracked on time.',                       link: 'Request Help →' },
  { ac: '#0891b2', bg: '#cffafe', icon: '🧑‍🤝‍🧑', title: 'NGO & Volunteer Events', desc: 'Join or organise food drives, winter clothes collections, and community service events near you.',                    link: 'View Events →' },
]

export default function Services() {
  return (
    <section id="services" className="section services-section">
      <div className="section-inner">
        <div className="services-header">
          <span className="eyebrow">What We Offer</span>
          <h2 className="section-heading">Six Ways We Help Your Community</h2>
          <p className="section-lead">Every service is free, verified, and matched to your local area. Real help, from real neighbours.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div className="svc-card" style={{ '--ac': s.ac }} key={i}>
              <div className="svc-icon-wrap" style={{ background: s.bg }}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <a href="#" className="svc-link">{s.link}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
