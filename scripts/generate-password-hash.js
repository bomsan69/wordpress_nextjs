#!/usr/bin/env node

/**
 * Password Hash Generator
 *
 * This script generates a bcrypt hash for the admin password.
 * Use this to create ADMIN_PASSWORD_HASH for your .env file.
 *
 * Usage:
 *   node scripts/generate-password-hash.js <password>
 *
 * Example:
 *   node scripts/generate-password-hash.js mySecurePassword123
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function generatePasswordHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('Error: Password is required');
    console.log('\nUsage:');
    console.log('  node scripts/generate-password-hash.js <password>');
    console.log('\nExample:');
    console.log('  node scripts/generate-password-hash.js mySecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    console.log('Generating password hash...\n');
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('✅ Password hash generated successfully!\n');
    console.log('Add this to your .env or .env.local file:');
    console.log('─'.repeat(80));
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('─'.repeat(80));
    console.log('\nIMPORTANT:');
    console.log('1. Copy the line above to your .env file');
    console.log('2. Remove or comment out the old ADMIN_PASSWORD line');
    console.log('3. Never commit the .env file to git');
    console.log('4. Use different passwords for dev/staging/production');
    console.log('\nPassword strength tips:');
    console.log('- At least 12 characters');
    console.log('- Mix of uppercase, lowercase, numbers, and symbols');
    console.log('- Avoid common words and patterns');
    console.log('- Use a password manager\n');
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  }
}

generatePasswordHash();
