import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This function handles the initialization of the Firebase Admin SDK.
// It's designed to be robust, avoiding re-initialization and handling
// different environments (production vs. emulators) gracefully.
const createFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApp();
  }

  // Case 1: Using Firebase Emulators.
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    console.log('\x1b[33m%s\x1b[0m', '[Firebase Admin] Initializing in Emulator Mode...');
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  // Case 2: Production environment, using a service account key.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features requiring admin privileges are disabled.');
  }

  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    console.log('\x1b[32m%s\x1b[0m', '[Firebase Admin] Initializing with service account...');
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    throw new Error(`[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it's valid JSON. Error: ${errorMessage}`);
  }
};

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

try {
  adminApp = createFirebaseAdminApp();
  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
} catch (error) {
  console.error(error);
  // To prevent the app from crashing, we can assign null or a mock object in case of failure.
  // However, for this app, we'll let it throw during startup if config is bad.
  // In a real-world scenario, you might handle this more gracefully.
  // For now, any part of the app trying to use these will fail if initialization failed.
}


export { adminApp, adminDb, adminAuth };
