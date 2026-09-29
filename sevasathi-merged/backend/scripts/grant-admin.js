// One-off CLI script to grant the 'admin' role to an existing user.
// The admin role has no public registration/self-service path by design
// (see src/services/user.service.js#addRole) — this script is the only
// supported way to create an admin account.
//
// Usage:
//   node backend/scripts/grant-admin.js user@example.com
//   node backend/scripts/grant-admin.js user@example.com --revoke

const mongoose = require('mongoose');
const config = require('../src/config/env');
const { User } = require('../src/models/user.model');

async function main() {
  const identifier = process.argv[2];
  const revoke = process.argv.includes('--revoke');

  if (!identifier) {
    console.error('Usage: node backend/scripts/grant-admin.js <email-or-phone> [--revoke]');
    process.exit(1);
  }

  await mongoose.connect(config.MONGO_URI);

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });

  if (!user) {
    console.error(`No user found matching "${identifier}"`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (revoke) {
    user.roles = user.roles.filter((r) => r !== 'admin');
  } else if (!user.roles.includes('admin')) {
    user.roles.push('admin');
  }

  await user.save();

  console.log(
    `${revoke ? 'Revoked' : 'Granted'} admin ${revoke ? 'from' : 'to'} ${user.fullName} (${user.email || user.phone}).`
  );
  console.log(`Current roles: ${user.roles.join(', ')}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
