import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthBrand from '../../components/ui/AuthBrand.jsx'
import { registerUser, verifyAccountOtp, resendAccountOtp, loginUser, addRole } from '../../services/authService.js'
import { registerAsBloodDonor } from '../../services/bloodDonorService.js'
import { registerAsVolunteer } from '../../services/volunteerService.js'
import { registerNGO } from '../../services/ngoService.js'
import { useAuth } from '../../context/AuthContext.jsx'

// UI role key -> backend role enum (see backend/src/models/user.model.js ROLES)
const ROLE_TO_BACKEND = { user: 'regular_user', donor: 'blood_donor', volunteer: 'volunteer', ngo: 'ngo' }

// UI "Availability" select label -> backend Volunteer.preferredTimeSlot enum
const AVAILABILITY_TO_SLOT = {
  'Weekends only': 'weekend_only',
  'Weekdays only': 'flexible',
  'Both weekdays & weekends': 'flexible',
  'Flexible / On-call': 'flexible',
}

// UI "Organization Type" select label -> backend NGO.orgType enum
const ORG_TYPE_TO_BACKEND = {
  'NGO': 'ngo',
  'NSS Unit': 'nss_unit',
  'Student Club': 'other',
  'Community Group': 'community_group',
  'Hospital / Clinic': 'other',
  'Other': 'other',
}

const ROLE_LABELS = { user: '🙋 Regular User', donor: '🩸 Blood Donor', volunteer: '🤝 Volunteer', ngo: '🏛️ NGO / Organization' }

const SKILLS = ['Teaching / Tutoring', 'Food Distribution', 'Medical Assistance', 'Logistics', 'Fundraising', 'Tech / Digital', 'Other']

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function getStrength(value) {
  if (!value) return null
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const levels = [
    { pct: '25%', color: '#e74c3c', text: 'Weak' },
    { pct: '50%', color: '#f59e0b', text: 'Fair' },
    { pct: '75%', color: '#3b82f6', text: 'Good' },
    { pct: '100%', color: '#16a974', text: 'Strong' },
  ]
  return levels[Math.max(0, score - 1)]
}

/* ── Step Indicator ── */
function StepIndicator({ currentStep }) {
  return (
    <>
      <div className="step-indicator" id="stepIndicator">
        {[1, 2, 3].map((n) => (
          <React.Fragment key={n}>
            <div
              className={`step-dot${currentStep === n ? ' active' : ''}${currentStep > n ? ' done' : ''}`}
              data-step={n}
            >
              <span>{n}</span>
            </div>
            {n < 3 && <div className={`step-line${currentStep > n ? ' done' : ''}`}></div>}
          </React.Fragment>
        ))}
      </div>
      <div className="step-labels">
        {['Your Role', 'Details', 'Account'].map((lbl, i) => (
          <span
            key={i}
            className={`step-label${currentStep === i + 1 ? ' active' : ''}${currentStep > i + 1 ? ' done' : ''}`}
          >{lbl}</span>
        ))}
      </div>
    </>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [roleError, setRoleError] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState([])
  const [regMethod, setRegMethod] = useState('email')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  // Step 2 fields (common + role-specific)
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [lastDonationDate, setLastDonationDate] = useState('')
  const [willingEmergency, setWillingEmergency] = useState(false)
  const [availability, setAvailability] = useState('Weekends only')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('NGO')
  const [registrationNumber, setRegistrationNumber] = useState('')

  // Step 3 fields
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Post-signup OTP verification
  const [pendingUserId, setPendingUserId] = useState(null)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const strength = getStrength(password)

  // Creates the role-specific profile (blood donor / volunteer / ngo) for
  // one selected role. Called once per role, after the user is verified
  // and logged in (these endpoints require an access token).
  // Adds a role, but treats "you already have this role" (409) as success —
  // this happens on retry after a previous attempt partially completed
  // (e.g. role was added but the profile-creation step failed).
  async function addRoleIdempotent(role) {
    try {
      await addRole(role)
    } catch (err) {
      if (err.response?.status !== 409) throw err
    }
  }

  // Runs a profile-creation call, but treats "profile already exists" (409)
  // as success too — same retry-after-partial-failure scenario as roles.
  async function createProfileIdempotent(fn) {
    try {
      await fn()
    } catch (err) {
      if (err.response?.status !== 409) throw err
    }
  }

  async function createRoleProfile(role) {
    if (role === 'donor') {
      await addRoleIdempotent(ROLE_TO_BACKEND.donor)
      await createProfileIdempotent(() => registerAsBloodDonor({
        bloodGroup: bloodGroup.replace('−', '-'), // normalize UI minus-sign to hyphen
        lastDonationDate: lastDonationDate || undefined,
        availableForEmergency: willingEmergency,
        city,
        pincode,
      }))
    } else if (role === 'volunteer') {
      await addRoleIdempotent(ROLE_TO_BACKEND.volunteer)
      await createProfileIdempotent(() => registerAsVolunteer({
        skills: selectedSkills,
        preferredTimeSlot: AVAILABILITY_TO_SLOT[availability] || 'flexible',
        city,
        pincode,
      }))
    } else if (role === 'ngo') {
      await addRoleIdempotent(ROLE_TO_BACKEND.ngo)
      await createProfileIdempotent(() => registerNGO({
        orgName,
        orgType: ORG_TYPE_TO_BACKEND[orgType] || 'other',
        registrationNumber,
        city,
        pincode,
      }))
    }
    // 'user' -> 'regular_user' is the default role on signup, nothing to do
  }

  function toggleRole(role) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
    setRoleError(false)
  }

  function toggleSkill(skill) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  function goToStep(n) {
    if (n === 2 && selectedRoles.length === 0) {
      setRoleError(true)
      return
    }
    setStep(n)
    /* Scroll to top of panel */
    setTimeout(() => {
      document.querySelector('.auth-panel-inner')?.scrollTo(0, 0)
    }, 0)
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regMethod === 'email') {
      const confirmInput = document.getElementById('regConfirm')
      if (confirmInput && confirmInput.value !== password) {
        setConfirmError(true)
        return
      }
    }
    setConfirmError(false)
    setVerifyError('')
    setLoading(true)
    try {
      const { user } = await registerUser({
        fullName,
        email: regMethod === 'email' ? email : undefined,
        phone: regMethod === 'phone' ? phone : undefined,
        password,
      })
      setPendingUserId(user._id || user.id)
      setStep(4) // move to OTP verification step
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Registration failed. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpInput(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otpValues]
    next[index] = digit
    setOtpValues(next)
  }

  async function handleVerifyAndFinish(e) {
    e.preventDefault()
    setVerifyError('')
    setVerifyLoading(true)
    try {
      await verifyAccountOtp({ userId: pendingUserId, otp: otpValues.join(''), purpose: 'email_verification' })

      // Now that the account is verified, log in to get a real access token
      const identifier = regMethod === 'email' ? email : phone
      const { user, accessToken } = await loginUser(identifier, password)
      login(user, accessToken)

      // Create a profile for every extra role the user picked in Step 1
      for (const role of selectedRoles) {
        if (role !== 'user') await createRoleProfile(role)
      }

      setSuccess(true)
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Verification failed. Please check the OTP and try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  async function handleResendOtp() {
    setResendMsg('')
    try {
      await resendAccountOtp({ userId: pendingUserId, purpose: 'email_verification' })
      setResendMsg('A new OTP has been sent.')
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Could not resend OTP.')
    }
  }

  function handleGoogle() {
    alert('Google Sign-In requires Firebase or Google OAuth integration.\nConnect your backend to enable this.')
  }

  const roleSubtitle = selectedRoles.length > 0
    ? 'Fill in details for: ' + selectedRoles.map((r) => ({ user: 'Regular User', donor: 'Blood Donor', volunteer: 'Volunteer', ngo: 'NGO / Organization' }[r])).join(', ') + '.'
    : 'Fill in your details based on your selected role.'

  return (
    <body className="auth-body">
      <div className="auth-layout">

        {/* ── Left Panel ── */}
        <div className="auth-panel-left">
          <div className="auth-panel-inner">

            <AuthBrand />

            {!success && step <= 3 && <StepIndicator currentStep={step} />}

            {/* ════ STEP 1: Role Selection ════ */}
            {step === 1 && !success && (
              <div className="reg-step">
                <h1 className="auth-heading">Who are you?</h1>
                <p className="auth-subheading">Choose your role. You can always add more roles later from your profile.</p>

                <div className="role-grid">
                  {[
                    { role: 'user',      icon: '🙋', name: 'Regular User',        desc: 'Request help, share resources, and connect with your community' },
                    { role: 'donor',     icon: '🩸', name: 'Blood Donor',         desc: 'Register as a verified donor and save lives in your area' },
                    { role: 'volunteer', icon: '🤝', name: 'Volunteer',            desc: 'Offer your time and skills for community events and drives' },
                    { role: 'ngo',       icon: '🏛️', name: 'NGO / Organization',  desc: 'Register your NGO, NSS unit, or community group' },
                  ].map(({ role, icon, name, desc }) => (
                    <div
                      key={role}
                      className={`role-card${selectedRoles.includes(role) ? ' selected' : ''}`}
                      data-role={role}
                      onClick={() => toggleRole(role)}
                    >
                      <div className="role-icon">{icon}</div>
                      <div className="role-name">{name}</div>
                      <div className="role-desc">{desc}</div>
                      <div className="role-check">✓</div>
                    </div>
                  ))}
                </div>

                {roleError && (
                  <div className="role-error">Please select at least one role to continue.</div>
                )}

                <button className="btn-auth-primary" onClick={() => goToStep(2)}>
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}

            {/* ════ STEP 2: Details ════ */}
            {step === 2 && !success && (
              <div className="reg-step">
                <h1 className="auth-heading">Tell us about yourself.</h1>
                <p className="auth-subheading">{roleSubtitle}</p>

                <form onSubmit={(e) => { e.preventDefault(); goToStep(3) }}>
                  {/* Common fields */}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-wrap">
                      <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      <input type="text" className="form-input" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">City / Town</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <input type="text" className="form-input" placeholder="e.g. Kolkata" value={city} onChange={(e) => setCity(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <div className="input-wrap">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                        </svg>
                        <input type="text" className="form-input" placeholder="700001" maxLength={6} pattern="[0-9]{6}" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {/* Blood Donor fields */}
                  {selectedRoles.includes('donor') && (
                    <div className="role-fields">
                      <div className="role-fields-label">🩸 Blood Donor Details</div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">Blood Group</label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2L8 8H4l4 4-2 6 6-4 6 4-2-6 4-4h-4z" />
                            </svg>
                            <select className="form-input form-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                              <option value="">Select blood group</option>
                              {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map((g) => (
                                <option key={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Donation Date</label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <input type="date" className="form-input" value={lastDonationDate} onChange={(e) => setLastDonationDate(e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <label className="form-checkbox" style={{ marginBottom: '12px' }}>
                        <input type="checkbox" checked={willingEmergency} onChange={(e) => setWillingEmergency(e.target.checked)} /> <span>I am willing to be contacted for emergency requests</span>
                      </label>
                    </div>
                  )}

                  {/* Volunteer fields */}
                  {selectedRoles.includes('volunteer') && (
                    <div className="role-fields">
                      <div className="role-fields-label">🤝 Volunteer Details</div>
                      <div className="form-group">
                        <label className="form-label">Skills / Areas of Help</label>
                        <div className="skill-tags">
                          {SKILLS.map((skill) => (
                            <div
                              key={skill}
                              className={`skill-tag${selectedSkills.includes(skill) ? ' selected' : ''}`}
                              onClick={() => toggleSkill(skill)}
                            >{skill}</div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Availability</label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                          <select className="form-input form-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                            <option>Weekends only</option>
                            <option>Weekdays only</option>
                            <option>Both weekdays &amp; weekends</option>
                            <option>Flexible / On-call</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NGO fields */}
                  {selectedRoles.includes('ngo') && (
                    <div className="role-fields">
                      <div className="role-fields-label">🏛️ Organization Details</div>
                      <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                          <input type="text" className="form-input" placeholder="e.g. Helping Hands NGO" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label className="form-label">Organization Type</label>
                          <div className="input-wrap">
                            <select className="form-input form-select" value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                              {['NGO', 'NSS Unit', 'Student Club', 'Community Group', 'Hospital / Clinic', 'Other'].map((t) => (
                                <option key={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Registration No.</label>
                          <div className="input-wrap">
                            <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                            <input type="text" className="form-input" placeholder="NGO reg. number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="step-nav">
                    <button type="button" className="btn-auth-back" onClick={() => goToStep(1)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Back
                    </button>
                    <button type="submit" className="btn-auth-primary" style={{ flex: 1 }}>
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ════ STEP 3: Account Credentials ════ */}
            {step === 3 && !success && (
              <div className="reg-step">
                <h1 className="auth-heading">Create your account.</h1>
                <p className="auth-subheading">Almost done! Set up your login credentials.</p>

                {/* Method Toggle */}
                <div className="auth-method-toggle">
                  <button className={`method-btn${regMethod === 'email' ? ' active' : ''}`} onClick={() => setRegMethod('email')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                    </svg>
                    Email
                  </button>
                  <button className={`method-btn${regMethod === 'phone' ? ' active' : ''}`} onClick={() => setRegMethod('phone')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Phone
                  </button>
                </div>

                <form onSubmit={handleRegister}>
                  {verifyError && (
                    <div className="role-error" style={{ marginBottom: '16px' }}>{verifyError}</div>
                  )}
                  {regMethod === 'email' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" />
                          </svg>
                          <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            id="regPassword"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button type="button" className="input-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {password && strength && (
                          <div className="password-strength">
                            <div className="strength-track">
                              <div className="strength-fill" style={{ width: strength.pct, background: strength.color }}></div>
                            </div>
                            <span className="strength-label" style={{ color: strength.color }}>{strength.text}</span>
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            className="form-input"
                            id="regConfirm"
                            placeholder="Re-enter password"
                            style={confirmError ? { borderColor: '#e74c3c' } : {}}
                            onChange={() => setConfirmError(false)}
                          />
                          <button type="button" className="input-toggle" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}>
                            {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                        {confirmError && <span className="form-hint" style={{ color: '#e74c3c' }}>Passwords do not match</span>}
                      </div>
                    </>
                  )}

                  {regMethod === 'phone' && (
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <div className="input-wrap">
                        <div className="phone-prefix">+91</div>
                        <input type="tel" className="form-input phone-input" placeholder="98765 43210" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      </div>
                      <span className="form-hint">A verification OTP will be sent after registration</span>
                    </div>
                  )}

                  <label className="form-checkbox" style={{ marginBottom: '20px' }}>
                    <input type="checkbox" required />
                    <span>I agree to the <a href="#" className="form-label-link">Terms of Service</a> and <a href="#" className="form-label-link">Privacy Policy</a></span>
                  </label>

                  <div className="step-nav">
                    <button type="button" className="btn-auth-back" onClick={() => goToStep(2)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Back
                    </button>
                    <button type="submit" className="btn-auth-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? 'Creating account…' : 'Create Account'}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </form>

                <div className="auth-divider"><span>or sign up with</span></div>
                <button className="btn-google" onClick={handleGoogle}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {/* ════ STEP 4: OTP Verification ════ */}
            {step === 4 && !success && (
              <div className="reg-step">
                <h1 className="auth-heading">Verify your account.</h1>
                <p className="auth-subheading">
                  We sent a 6-digit code to {regMethod === 'email' ? email : `+91 ${phone}`}.
                  {regMethod === 'phone' && ' (Note: phone OTP delivery isn\'t wired up on the backend yet — check the server console for the code during development.)'}
                </p>

                {verifyError && <div className="role-error" style={{ marginBottom: '14px' }}>{verifyError}</div>}

                <form onSubmit={handleVerifyAndFinish}>
                  <div className="form-group">
                    <label className="form-label">Enter OTP</label>
                    <div className="otp-inputs">
                      {otpValues.map((val, i) => (
                        <input
                          key={i}
                          type="text"
                          className="otp-box"
                          maxLength={1}
                          value={val}
                          onChange={(e) => handleOtpInput(i, e.target.value)}
                        />
                      ))}
                    </div>
                    <span className="form-hint">
                      Didn't get it?{' '}
                      <a href="#" className="form-label-link" onClick={(e) => { e.preventDefault(); handleResendOtp() }}>Resend OTP</a>
                      {resendMsg && <span> — {resendMsg}</span>}
                    </span>
                  </div>

                  <button type="submit" className="btn-auth-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={verifyLoading}>
                    {verifyLoading ? 'Verifying…' : 'Verify & Create Account'}
                  </button>
                </form>
              </div>
            )}

            {/* ════ SUCCESS STATE ════ */}
            {success && (
              <div className="reg-step">
                <div className="success-wrap">
                  <div className="success-icon">🎉</div>
                  <h2 className="auth-heading" style={{ marginBottom: '10px' }}>You're all set!</h2>
                  <p className="auth-subheading">Welcome to SevaSathi. Your account has been created successfully.</p>
                  <div className="success-roles">
                    {selectedRoles.map((r) => (
                      <div key={r} className="success-role-tag">{ROLE_LABELS[r]}</div>
                    ))}
                  </div>
                  <Link to="/" className="btn-auth-primary" style={{ marginTop: '24px', textDecoration: 'none', justifyContent: 'center' }}>
                    Go to Home →
                  </Link>
                  <Link to="/login" className="auth-switch" style={{ display: 'block', textAlign: 'center', marginTop: '14px' }}>
                    Already have another account? Log in →
                  </Link>
                </div>
              </div>
            )}

            {!success && (
              <p className="auth-switch">
                Already have an account? <Link to="/login">Log in →</Link>
              </p>
            )}

          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel-right">
          <div className="auth-panel-right-inner">
            <div className="auth-right-badge">🇮🇳 Serving communities across India</div>
            <h2 className="auth-right-heading">Be the change your community needs.</h2>
            <p className="auth-right-sub">Whether you want to donate blood, share books, volunteer, or register your NGO — SevaSathi connects you with people who need you most.</p>
            <div className="auth-impact-list">
              {[
                { icon: '🩸', bold: 'Blood donors', rest: 'save lives in under 10 minutes' },
                { icon: '📚', bold: 'Book donors', rest: 'help students reach their potential' },
                { icon: '🤝', bold: 'Volunteers', rest: 'power food drives and events' },
                { icon: '🏛️', bold: 'NGOs', rest: 'coordinate large-scale community impact' },
              ].map((item, i) => (
                <div key={i} className="impact-item-mini">
                  <span className="iim-icon">{item.icon}</span>
                  <div><strong>{item.bold}</strong> {item.rest}</div>
                </div>
              ))}
            </div>
            <div className="auth-testimonial-mini">
              <div className="atm-quote">"Registering as a volunteer took 2 minutes. Within a week I was helping 40 families."</div>
              <div className="atm-author">— Sneha Roy, NSS Volunteer, Jadavpur</div>
            </div>
          </div>
        </div>

      </div>
    </body>
  )
}
