// Static / mock data used before a real backend is connected.
// Swap this out for a live API call (see src/services) when ready.
export const ngoList = [
  { id: 1, name: 'Ray of Hope Foundation', cause: 'Child Education', city: 'Kolkata' },
  { id: 2, name: 'GreenEarth Trust', cause: 'Environment', city: 'Bengaluru' },
  { id: 3, name: 'Anna Seva Mission', cause: 'Food Security', city: 'Chennai' },
]

export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const dashboardStats = {
  totalDonors: 1240,
  activeRequests: 18,
  ngoPartners: 42,
  volunteers: 356,
}
