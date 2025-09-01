
import { initializeApp, getApps, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This "lazy initialization" pattern ensures that environment variables are loaded
 * before the SDK is used, which is crucial in complex server environments like Next.js.
 * This function should be called at the beginning of any server-side logic that needs Firebase services.
 */
function initializeAdmin() {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features are disabled.');
      return; 
    }

    try {
      // Clean up the key before parsing
      const cleanedKey = serviceAccountKey.replace(/\\n/g, '\\n');
      const serviceAccount: ServiceAccount = JSON.parse(cleanedKey);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);

    } catch (e: unknown) {
      console.error('[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it\'s valid, single-line JSON in your .env file.', e);
    }
  } else {
      adminApp = getApps()[0];
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
  }
}

// Initialize on first import.
initializeAdmin();

export { adminApp, adminDb, adminAuth };
