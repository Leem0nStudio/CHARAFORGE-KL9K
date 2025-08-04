import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This function handles the initialization of the Firebase Admin SDK.
// It's designed to be robust, avoiding re-initialization and handling
// different environments (production vs. emulators) gracefully.
const createFirebaseAdminApp = (): App | null => {
  // If an app is already initialized, return it to prevent errors.
  if (getApps().length > 0) {
    return getApp();
  }

  // Case 1: Using Firebase Emulators for local development.
  // The `NEXT_PUBLIC_USE_EMULATORS` flag dictates this.
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    // A projectId is required for emulator initialization.
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('\x1b[31m%s\x1b[0m', '[Firebase Admin] ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for emulator mode, but was not found. Admin SDK will not be initialized.');
      return null;
    }
    console.log('\x1b[33m%s\x1b[0m', '[Firebase Admin] Initializing in Emulator Mode...');
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  // Case 2: Production environment, using a service account key.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // The service account key is essential for production.
  if (!serviceAccountKey) {
    console.error('\x1b[31m%s\x1b[0m', '[Firebase Admin] ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server features requiring admin privileges will be disabled.');
    return null;
  }
  
  // A common mistake is leaving the key as an empty object.
  if (serviceAccountKey.trim() === "" || serviceAccountKey.trim() === "{}") {
    console.warn('\x1b[33m%s\x1b[0m', '[Firebase Admin] WARN: FIREBASE_SERVICE_ACCOUNT_KEY is empty or an empty JSON object. Server features will be disabled. Please provide a valid service account key.');
    return null;
  }

  try {
    // The key is often stored with escaped newlines; this replaces them.
    const sanitizedKey = serviceAccountKey.replace(/\\n/g, '\n');
    const serviceAccount: ServiceAccount = JSON.parse(sanitizedKey);

    // Validate the parsed service account for the necessary property.
    if (!serviceAccount.projectId && !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.error('\x1b[31m%s\x1b[0m', '[Firebase Admin] ERROR: Service account JSON is missing "project_id" and no NEXT_PUBLIC_FIREBASE_PROJECT_ID is set. Admin SDK initialization failed.');
      return null;
    }
    
    // Initialize the app with the service account credentials.
    console.log('\x1b[32m%s\x1b[0m', '[Firebase Admin] Initializing with service account...');
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    // Catch any JSON parsing errors.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`\x1b[31m%s\x1b[0m`, `[Firebase Admin] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it's valid JSON. Error: ${errorMessage}`);
    return null;
  }
};

// Initialize the app. This will be null if initialization fails.
const adminApp = createFirebaseAdminApp();

// Create getter functions to safely retrieve Firebase services.
// This prevents errors if the main app initialization failed.
const getAdminDb = (): Firestore | null => {
  if (!adminApp) return null;
  try {
    return getFirestore(adminApp);
  } catch (e) {
    console.error('\x1b[31m%s\x1b[0m', '[Firebase Admin] Failed to get Firestore instance:', e);
    return null;
  }
};

const getAdminAuth = (): Auth | null => {
    if (!adminApp) return null;
    try {
        return getAuth(adminApp);
    } catch(e) {
        console.error('\x1b[31m%s\x1b[0m','[Firebase Admin] Failed to get Auth instance:', e);
        return null;
    }
}

// Export the initialized services. They will be null if something went wrong.
export const admin: App | null = adminApp;
export const adminDb: Firestore | null = getAdminDb();
export const adminAuth: Auth | null = getAdminAuth();