import { initializeApp, getApps, getApp, App, ServiceAccount, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = () => {
  // Set emulator hosts if they are defined in the environment
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  }
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (getApps().length > 0) {
    return getApp();
  }
  
  // When running in an emulated environment, we don't need a service account
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
     console.log('Initializing Firebase Admin SDK for emulators');
     return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  if (!serviceAccountKey || serviceAccountKey === "{}") {
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is empty. Server-side Firebase features will be limited.');
    // Return a dummy app or handle it gracefully
    return null;
  }
    
  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid JSON.');
  }
};

const adminApp = createFirebaseAdminApp();

const getAdminDb = () => {
  if (!adminApp) return null;
  try {
    return getFirestore(adminApp);
  } catch (e) {
    console.error("Failed to get Firestore instance", e)
    return null;
  }
};

const getAdminAuth = () => {
    if (!adminApp) return null;
    try {
        return getAuth(adminApp);
    } catch(e) {
        console.error("Failed to get Auth instance", e)
        return null;
    }
}


export const admin = adminApp;
export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
