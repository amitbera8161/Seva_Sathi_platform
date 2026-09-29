import React from 'react'

const HERO_CARDS = [
  { iconClass: 'red', icon: '🩸', title: 'Blood Donor Found', sub: 'B+ donor confirmed — Rajpur South', badgeClass: 'urgent', badge: '● Live' },
  { iconClass: 'grn', icon: '📚', title: '7 Books Available Near You', sub: 'Class 10 textbooks — free to collect', badgeClass: '', badge: 'New' },
  { iconClass: 'amb', icon: '🍱', title: 'Food Drive — This Saturday', sub: 'Helping Hands NGO · 200 meals', badgeClass: '', badge: 'Event' },
  { iconClass: 'blu', icon: '🤝', title: '12 Volunteer Tutors Available', sub: 'Free coaching for children near you', badgeClass: '', badge: 'Free' },
]

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid"></div>
      <div className="hero-inner">

        {/* Left: text + CTA */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="dot"></div>
            <span>🇮🇳 Built for India's Communities</span>
          </div>
          <h1>
            Support Your<br />
            Community.<br />
            <em>Fast. Verified.</em><br />
            <span className="dim">Local.</span>
          </h1>
          <p className="hero-desc">
            Find blood donors, share books, get food support, or volunteer —
            all in one verified, hyper-local platform built for real social impact.
          </p>
          <div className="search-bar">
            <input type="text" placeholder="Enter your pincode or area name…" />
            <button>Find Help Near Me</button>
          </div>
          <div className="hero-actions">
            <a href="#" className="btn-hero-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Request Emergency Help
            </a>
            <a href="#" className="btn-hero-secondary">Offer Help to Others →</a>
          </div>
        </div>

        {/* Right: live info cards */}
        <div className="hero-right" id="heroCards">
          {HERO_CARDS.map((card, i) => (
            <div className="hero-card" key={i}>
              <div className={`hc-icon ${card.iconClass}`}>{card.icon}</div>
              <div>
                <div className="hc-title">{card.title}</div>
                <div className="hc-sub">{card.sub}</div>
              </div>
              <div className={`hc-badge${card.badgeClass ? ' ' + card.badgeClass : ''}`}>{card.badge}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
