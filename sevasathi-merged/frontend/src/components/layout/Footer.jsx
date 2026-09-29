import React from 'react'

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="f-logo">🤝 SevaSathi</span>
          <p>A local community support ecosystem connecting students, blood donors, NGOs, volunteers, and families in need. Helping Locally. Impacting Lives.</p>
          <div className="social-row">
            <a href="#" className="social-pill">f</a>
            <a href="#" className="social-pill">in</a>
            <a href="#" className="social-pill">tw</a>
            <a href="#" className="social-pill">ig</a>
          </div>
        </div>
        <div className="footer-col">
          <h5>Services</h5>
          <ul>
            <li><a href="#">Blood Donor Network</a></li>
            <li><a href="#">Book Sharing</a></li>
            <li><a href="#">Food Assistance</a></li>
            <li><a href="#">Free Tuition</a></li>
            <li><a href="#">Medicine Help</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Organizations</h5>
          <ul>
            <li><a href="#">Register NGO</a></li>
            <li><a href="#">NSS Volunteers</a></li>
            <li><a href="#">Partner With Us</a></li>
            <li><a href="#">Volunteer Events</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Support</h5>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-base">
        <span>© 2024 SevaSathi. Helping Locally, Impacting Lives. ❤️</span>
        <div className="footer-base-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  )
}
