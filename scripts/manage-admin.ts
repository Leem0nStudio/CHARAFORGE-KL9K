import 'dotenv/config';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', (error as Error).message);
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

const grantAdminRole = async (uid: string) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
    console.log(`Success! User ${uid} has been granted the admin role.`);
  } catch (error) {
    console.error(`Error granting admin role to ${uid}:`, (error as Error).message);
  }
};

const revokeAdminRole = async (uid: string) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: false });
    await db.collection('users').doc(uid).set({ role: 'user' }, { merge: true });
    console.log(`Admin role has been revoked for user ${uid}.`);
  } catch (error) {
    console.error(`Error revoking admin role for ${uid}:`, (error as Error).message);
  }
};

const checkAdminStatus = async (uid: string) => {
  try {
    const user = await auth.getUser(uid);
    const isAdmin = !!(user.customClaims?.admin);
    console.log(`User ${uid} (${user.email || 'No Email'}) has admin status: ${isAdmin}`);
  } catch (error) {
    console.error(`Error checking admin status for ${uid}:`, (error as Error).message);
  }
};

const listAdmins = async () => {
  console.log('Fetching list of admins...');
  const admins: Array<{ uid: string; email?: string }> = [];
  try {
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
    console.error('Error listing admin users:', (error as Error).message);
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
      console.log('Usage:');
      console.log('  npm run admin:grant <uid>  - Grant admin role to user');
      console.log('  npm run admin:revoke <uid> - Revoke admin role from user');
      console.log('  npm run admin:check <uid>  - Check admin status of user');
      console.log('  npm run admin:list         - List all admin users');
      break;
  }
};

main().catch(console.error);