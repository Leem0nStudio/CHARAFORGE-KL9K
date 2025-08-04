import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features requiring admin privileges are disabled.');
  }

  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);

  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    adminApp = getApp();
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

} catch (error) {
  console.error('[Firebase Admin] Initialization failed:', error);
  // In case of error, we leave the instances as undefined.
  // The parts of the app using these services should handle this case.
}

export { adminApp, adminDb, adminAuth };
