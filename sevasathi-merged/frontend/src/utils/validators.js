export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone) // Indian 10-digit mobile numbers
}

export function isStrongPassword(password) {
  // At least 8 chars, one letter, one number
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
}
