import { randomBytes, scryptSync } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve, join } from 'node:path';

const username = process.argv[2];
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!username) { console.error('Usage: node scripts/reset-password.mjs admin (or master-1)'); process.exit(1); }
const directory = resolve(process.env.BOOKING_DATA_DIR || '.local');
const path = join(directory, 'staff.json');
const accounts = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const account = accounts.users.find(user => user.username === username);
if (!account) { console.error('Account not found. No changes made.'); process.exit(1); }
const password = randomBytes(18).toString('base64url');
account.salt = randomBytes(16).toString('hex');
account.passwordHash = scryptSync(password, account.salt, 64).toString('hex');
// Write the recovery file before changing credentials. Never print the password to logs.
const output = join(directory, 'password-reset-' + username + '.txt');
writeFileSync(output, `Login: ${username}\nPassword: ${password}\n`, { mode: 0o600 });
writeFileSync(path + '.tmp', JSON.stringify(accounts, null, 2), { mode: 0o600 });
renameSync(path + '.tmp', path);
console.log('Password replaced; previous sessions are invalidated. Retrieve and then delete: ' + output);
