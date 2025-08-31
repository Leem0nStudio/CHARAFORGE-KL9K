

require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Initialize Firebase Admin SDK for auth claims
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  process.exit(1);
}

// Initialize Supabase Client for database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Service Role Key is not set in environment variables.');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const auth = admin.auth();

const grantAdminRole = async (uid) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    // This now also sets the `role` field in Supabase DB for client-side checks.
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', uid);
    if (error) throw error;
    console.log(`Success! User ${uid} has been granted the admin role.`);
  } catch (error) {
    console.error(`Error granting admin role to ${uid}:`, error.message);
  }
};

const revokeAdminRole = async (uid) => {
  try {
    // Setting claims to null removes them, but setting to false is more explicit.
    await auth.setCustomUserClaims(uid, { admin: false });
    // This now also sets the `role` field in Supabase DB for client-side checks.
    const { error } = await supabase.from('users').update({ role: 'user' }).eq('id', uid);
    if (error) throw error;
    console.log(`Success! Admin role has been revoked for user ${uid}.`);
  } catch (error) {
    console.error(`Error revoking admin role for ${uid}:`, error.message);
  }
};

const checkAdminStatus = async (uid) => {
  try {
    const user = await auth.getUser(uid);
    const isAdmin = !!user.customClaims?.admin;
    console.log(`User ${uid} (${user.email || 'No Email'}) has admin status: ${isAdmin}`);
  } catch (error) {
    console.error(`Error checking admin status for ${uid}:`, error.message);
  }
};

const listAdmins = async () => {
  console.log('Fetching list of admins... (This may take a while for many users)');
  const admins = [];
  try {
    // Note: listUsers() paginates and might require multiple calls for large user bases.
    // For this script's purpose, fetching up to 1000 users is sufficient.
    const listUsersResult = await auth.listUsers(1000);
    listUsersResult.users.forEach(user => {
      if (user.customClaims?.admin) {
        admins.push({ uid: user.uid, email: user.email });
      }
    });

    if (admins.length === 0) {
      console.log('No admin users found.');
    } else {
      console.log('Admin Users:');
      console.table(admins);
    }
  } catch (error) {
    console.error('Error listing admin users:', error.message);
  }
};

const main = async () => {
  const [command, uid] = process.argv.slice(2);

  switch (command) {
    case 'grant':
      if (!uid) {
        console.error('Error: Please provide a UID to grant admin role.');
        process.exit(1);
      }
      await grantAdminRole(uid);
      break;

    case 'revoke':
      if (!uid) {
        console.error('Error: Please provide a UID to revoke admin role.');
        process.exit(1);
      }
      await revokeAdminRole(uid);
      break;

    case 'check':
      if (!uid) {
        console.error('Error: Please provide a UID to check admin status.');
        process.exit(1);
      }
      await checkAdminStatus(uid);
      break;

    case 'list':
      await listAdmins();
      break;

    default:
      console.log('Invalid command. Available commands:');
      console.log('  grant <uid>     - Grants admin role to a user');
      console.log('  revoke <uid>    - Revokes admin role from a user');
      console.log('  check <uid>     - Checks if a user is an admin');
      console.log('  list            - Lists all admin users');
      break;
  }
  process.exit(0);
};

main();
