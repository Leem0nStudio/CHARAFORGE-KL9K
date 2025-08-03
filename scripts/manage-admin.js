require('dotenv').config({ path: './.env' });
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
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

const auth = admin.auth();

const grantAdminRole = async (uid) => {
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    // Also update the role in Firestore
    await admin.firestore().collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
    console.log(`Success! User ${uid} has been granted the admin role.`);
  } catch (error) {
    console.error(`Error granting admin role to ${uid}:`, error.message);
  }
};

const revokeAdminRole = async (uid) => {
  try {
    // Setting claims to null removes them
    await auth.setCustomUserClaims(uid, { admin: false });
     // Also update the role in Firestore to 'user'
    await admin.firestore().collection('users').doc(uid).set({ role: 'user' }, { merge: true });
    console.log(`Success! Admin role has been revoked for user ${uid}.`);
  } catch (error) {
    console.error(`Error revoking admin role for ${uid}:`, error.message);
  }
};

const checkAdminStatus = async (uid) => {
  try {
    const user = await auth.getUser(uid);
    const isAdmin = !!user.customClaims?.admin;
    console.log(`User ${uid} (${user.email}) has admin status: ${isAdmin}`);
  } catch (error) {
    console.error(`Error checking admin status for ${uid}:`, error.message);
  }
};

const listAdmins = async () => {
  console.log('Fetching list of admins... (This may take a while for many users)');
  const admins = [];
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
