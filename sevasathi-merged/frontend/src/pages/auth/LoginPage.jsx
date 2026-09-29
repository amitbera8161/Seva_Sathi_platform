import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthBrand from '../../components/ui/AuthBrand.jsx'
import { loginUser } from '../../services/authService.js'
import { useAuth } from '../../context/AuthContext.jsx'

/* ── SVG helpers ── */
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function LoginPage() {
  const [method, setMethod] = useState('email')
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [loginLoading, setLoginLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const navigate = useNavigate()
  const otpRefs = useRef([])
  const timerRef = useRef(null)
  const { login } = useAuth()

  /* Clean up timer on unmount */
  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  /* Handlers */
  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { user, accessToken } = await loginUser(identifier, password)
      login(user, accessToken)
      navigate('/dashboard')
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoginLoading(false)
    }
  }

  function handleOTP(e) {
    e.preventDefault()
    if (!otpSent) {
      setOtpSent(true)
      startResendTimer(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } else {
      setOtpLoading(true)
      setTimeout(() => {
        setOtpLoading(false)
        window.location.href = '/'
      }, 1200)
    }
  }

  function startResendTimer(seconds) {
    clearInterval(timerRef.current)
    setResendTimer(seconds)
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function resendOTP(e) {
    e.preventDefault()
    clearInterval(timerRef.current)
    setOtpSent(false)
    setOtpValues(['', '', '', '', '', ''])
    setResendTimer(0)
    /* Re-trigger the send flow after state flush */
    setTimeout(() => {
      setOtpSent(true)
      startResendTimer(30)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }, 0)
  }

  function handleOtpInput(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpValues]
    next[index] = digit
    setOtpValues(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(e, index) {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
      const next = [...otpValues]
      next[index - 1] = ''
      setOtpValues(next)
    }
  }

  function handleGoogle() {
    alert('Google Sign-In requires Firebase or Google OAuth integration.\nConnect your backend to enable this.')
  }

  return (
    <body className="auth-body">
      <div className="auth-layout">

        {/* ── Left Panel ── */}
        <div className="auth-panel-left">
          <div className="auth-panel-inner">

            <AuthBrand />

            <h1 className="auth-heading">Welcome back.</h1>
            <p className="auth-subheading">Log in to connect with your community, find help, or offer support to those in need.</p>

            {/* Method Toggle */}
            <div className="auth-method-toggle">
              <button
                className={`method-btn${method === 'email' ? ' active' : ''}`}
                onClick={() => setMethod('email')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                </svg>
                Email
              </button>
              <button
                className={`method-btn${method === 'phone' ? ' active' : ''}`}
                onClick={() => setMethod('phone')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Phone
              </button>
            </div>

            {/* Email Login Form */}
            {method === 'email' && (
              <form className="auth-form" onSubmit={handleLogin}>
                {loginError && (
                  <div className="role-error" style={{ marginBottom: '14px' }}>{loginError}</div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                    </svg>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Password
                    <a href="#" className="form-label-link">Forgot password?</a>
                  </label>
                  <div className="input-wrap">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="input-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div className="form-row-check">
                  <label className="form-checkbox">
                    <input type="checkbox" /> <span>Keep me logged in</span>
                  </label>
                </div>
                <button type="submit" className="btn-auth-primary" disabled={loginLoading}>
                  {loginLoading ? 'Logging in…' : 'Log In'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </form>
            )}

            {/* Phone Login Form */}
            {method === 'phone' && (
              <form className="auth-form" onSubmit={handleOTP}>
                <div className="role-error" style={{ marginBottom: '14px' }}>
                  Passwordless phone login isn't implemented on the backend yet — this tab is a preview only. Please use Email to log in for real.
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-wrap">
                    <div className="phone-prefix">+91</div>
                    <input type="tel" className="form-input phone-input" placeholder="98765 43210" maxLength={10} pattern="[0-9]{10}" required />
                  </div>
                  <span className="form-hint">We'll send a 6-digit OTP to this number</span>
                </div>

                {otpSent && (
                  <div className="otp-section">
                    <div className="form-group">
                      <label className="form-label">Enter OTP</label>
                      <div className="otp-inputs">
                        {otpValues.map((val, i) => (
                          <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            type="text"
                            className="otp-box"
                            maxLength={1}
                            value={val}
                            onChange={(e) => handleOtpInput(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          />
                        ))}
                      </div>
                      <span className="form-hint">
                        Didn't get it?{' '}
                        <a href="#" className="form-label-link" onClick={resendOTP}>Resend OTP</a>
                        {resendTimer > 0 && <span id="resendTimer"> ({resendTimer}s)</span>}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-auth-primary" disabled={otpLoading}>
                  {otpLoading ? 'Verifying…' : otpSent ? 'Verify OTP' : 'Send OTP'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </form>
            )}

            <div className="auth-divider"><span>or continue with</span></div>

            <button className="btn-google" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <p className="auth-switch">
              Don't have an account?{' '}
              <Link to="/register">Create one free →</Link>
            </p>

          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel-right">
          <div className="auth-panel-right-inner">
            <div className="auth-right-badge">🇮🇳 Serving communities across India</div>
            <h2 className="auth-right-heading">Every login is a step towards helping someone.</h2>
            <p className="auth-right-sub">Join thousands of verified members who are making real change in their local communities — one act of seva at a time.</p>
            <div className="auth-stat-pills">
              <div className="auth-stat-pill"><span>🩸</span> <strong>1,256</strong> Active Donors</div>
              <div className="auth-stat-pill"><span>📚</span> <strong>412</strong> Books Shared</div>
              <div className="auth-stat-pill"><span>🤝</span> <strong>980</strong> Volunteers</div>
              <div className="auth-stat-pill"><span>🌟</span> <strong>4,200+</strong> Lives Supported</div>
            </div>
            <div className="auth-testimonial-mini">
              <div className="atm-quote">"SevaSathi found a B+ donor for my father in 8 minutes at 2am. It saved his life."</div>
              <div className="atm-author">— Ravi Mondal, Kolkata</div>
            </div>
          </div>
        </div>

      </div>
    </body>
  )
}
