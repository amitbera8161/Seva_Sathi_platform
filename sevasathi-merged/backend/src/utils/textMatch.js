// People never type city names identically ("Kolkata" vs "kolkata" vs
// " Kolkata "), so any exact-string city comparison silently finds nobody
// even when donors and patients are in the same city. This builds a
// case-insensitive, whitespace-trimmed exact-match query value instead of
// doing a plain string comparison.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cityMatch(city) {
  const trimmed = (city || '').trim();
  if (!trimmed) return undefined;
  return new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
}

module.exports = { cityMatch };
