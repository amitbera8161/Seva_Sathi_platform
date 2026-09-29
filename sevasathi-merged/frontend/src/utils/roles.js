// Maps a user's `roles` array (backend/src/models/user.model.js ROLES)
// to one of the four dashboard experiences described in the SevaSathi spec.
// A user can hold multiple roles at once (see RegisterPage's multi-select),
// so this resolves a single "primary" dashboard using a fixed priority —
// used for the post-login redirect and for guarding dashboard routes.

export const DASHBOARD_TYPES = {
  ADMIN: 'admin',
  NGO: 'ngo',
  VOLUNTEER: 'volunteer',
  BENEFICIARY: 'beneficiary',
}

// Highest-priority role wins. 'blood_donor' is grouped with 'volunteer'
// because the spec places the donor side "inside the Volunteer/User
// Dashboard". 'book_donor' and 'regular_user' fall back to Beneficiary,
// since donating/requesting books is listed under the Beneficiary
// Dashboard's Book Support feature set.
export function getDashboardType(roles = []) {
  if (roles.includes('admin')) return DASHBOARD_TYPES.ADMIN
  if (roles.includes('ngo')) return DASHBOARD_TYPES.NGO
  if (roles.includes('volunteer') || roles.includes('blood_donor')) return DASHBOARD_TYPES.VOLUNTEER
  return DASHBOARD_TYPES.BENEFICIARY
}

export function getDashboardPath(roles = []) {
  return `/dashboard/${getDashboardType(roles)}`
}
