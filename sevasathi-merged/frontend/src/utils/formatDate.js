// Formats an ISO date string / Date object into a readable label,
// e.g. "23 Jul 2026".
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
