// Standard donor -> recipient transfusion compatibility.
// Key = a patient's required blood group (what a BloodRequest asks for).
// Value = every donor blood group medically able to donate to that patient,
// INCLUDING the exact match itself (index 0 by convention, though callers
// should not rely on ordering — filter it out explicitly when needed).
//
// This is deliberately a static, well-known medical reference table, not
// something derived at runtime — transfusion compatibility doesn't change.
const COMPATIBLE_DONOR_GROUPS = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'], // universal recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'], // universal donor, but can only *receive* from O-
};

// Every donor group compatible with `recipientGroup`, EXCLUDING the exact
// match — i.e. just the "expand beyond exact" tier used by matching's
// second pass. Returns [] for an unknown group rather than throwing, since
// this sits on the matching hot path and a bad group should already have
// been rejected by schema validation upstream.
function getCompatibleDonorGroups(recipientGroup) {
  const all = COMPATIBLE_DONOR_GROUPS[recipientGroup] || [];
  return all.filter((g) => g !== recipientGroup);
}

module.exports = { COMPATIBLE_DONOR_GROUPS, getCompatibleDonorGroups };
