import { initializeApp, getApps, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'dotenv/config';

// Define a shape for the returned services for type safety.
type FirebaseAdminServices = {
  adminApp: App;
  adminAuth: Auth;
  adminDb: Firestore;
};

// Global variables to hold the initialized services.
let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This "lazy initialization" pattern ensures that environment variables are loaded
 * before the SDK is used, which is crucial in complex environments like Next.js.
 * 
 * @returns {FirebaseAdminServices} An object containing the initialized admin services.
 * @throws {Error} If the service account key is missing or invalid.
 */
function initializeAdmin() {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('[Firebase Admin] FATAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features are disabled.');
    }

    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });

      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);

    } catch (e: unknown) {
      console.error('[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it\'s valid, single-line JSON in your .env file.');
      // Re-throw the error to halt execution if initialization fails.
      throw e;
    }
  } else {
    // If already initialized, just get the existing instances.
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
}

// Initialize on first load.
try {
  initializeAdmin();
} catch (error) {
    // Log the initialization error but allow the app to run,
    // subsequent calls in actions will throw more specific errors.
    console.error("Firebase Admin SDK initialization failed:", error);
}


export { adminApp, adminDb, adminAuth };
