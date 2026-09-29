import React from 'react'

const TESTIMONIALS = [
  {
    text: "My father needed B+ blood urgently at 2am. Within 8 minutes of posting on SevaSathi, a verified donor called us. I cannot express what that meant to our family.",
    av: 'R', name: 'Ravi Mondal', role: 'Kolkata, West Bengal',
  },
  {
    text: "I got all my Class 10 textbooks free through SevaSathi. A senior student donated them. My family couldn't afford them. Now I scored 89% in my board exams!",
    av: 'P', name: 'Priya Das', role: 'Rajpur Sonarpur, Student',
  },
  {
    text: "Our NGO used to struggle coordinating 50 volunteers. SevaSathi made it effortless. We now run monthly food drives reaching 300 families every month.",
    av: 'A', name: 'Anita Sharma', role: 'Director, Helping Hands NGO',
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="test-header">
        <span className="eyebrow">Real Stories</span>
        <h2 className="section-heading">Lives Changed by SevaSathi</h2>
        <p className="section-lead">Real people. Real moments. Real impact across communities.</p>
      </div>
      <div className="test-grid">
        {TESTIMONIALS.map((t, i) => (
          <div className="test-card" key={i}>
            <div className="test-quote-mark">"</div>
            <p className="test-text">{t.text}</p>
            <div className="test-author">
              <div className="test-av">{t.av}</div>
              <div>
                <div className="test-name">{t.name}</div>
                <div className="test-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
