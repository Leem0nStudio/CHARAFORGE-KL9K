import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// This function centralizes the logic for creating the Firebase Admin App.
// It handles both production (with service account) and emulated environments.
const createFirebaseAdminApp = (): App | null => {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return getApp();
  }
  
  // For emulated environments, we don't need a service account.
  // The Admin SDK will automatically connect to the emulators if the correct
  // environment variables are set by the Firebase CLI.
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
     return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  // If the service account key is missing or is the placeholder empty object,
  // we cannot initialize the admin app. Return null.
  if (!serviceAccountKey || serviceAccountKey === "{}") {
    return null;
  }
    
  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    // A basic check to see if the parsed service account is valid.
    if (!serviceAccount.projectId) {
         return null;
    }
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: unknown) {
    // This will catch errors from JSON.parse if the key is malformed.
    // In production, you'd want to log this to a proper monitoring service.
    if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
        console.error('SERVER: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
    }
    return null;
  }
};

const adminApp = createFirebaseAdminApp();

// These getter functions ensure that we don't try to get services from a null app.
const getAdminDb = (): Firestore | null => {
  if (!adminApp) return null;
  try {
    return getFirestore(adminApp);
  } catch (e) {
    return null;
  }
};

const getAdminAuth = (): Auth | null => {
    if (!adminApp) return null;
    try {
        return getAuth(adminApp);
    } catch(e) {
        return null;
    }
}

export const admin: App | null = adminApp;
export const adminDb: Firestore | null = getAdminDb();
export const adminAuth: Auth | null = getAdminAuth();
