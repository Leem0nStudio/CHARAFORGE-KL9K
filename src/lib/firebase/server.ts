import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features are disabled.');
  }
  
  // No need to replace newlines manually if the JSON is parsed correctly.
  let serviceAccount: ServiceAccount;
  try {
      // The most robust way is to parse the raw string from the .env file.
      serviceAccount = JSON.parse(serviceAccountKey);
  } catch (e: unknown) {
      // Throw a more specific error if JSON parsing fails.
      throw new Error(`[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it's valid, single-line JSON in your .env file. Details: ${e instanceof Error ? e.message : 'Unknown parsing error.'}`);
  }
  
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
  // Log the fatal error. The services will remain undefined.
  console.error(error);
}

export { adminApp, adminDb, adminAuth };
