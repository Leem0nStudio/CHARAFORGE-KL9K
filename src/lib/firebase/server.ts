
import { initializeApp, getApps, getApp, App, ServiceAccount, Credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }
  
  // When running in an emulated environment, we don't need a service account
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
     console.log('SERVER: Initializing Firebase Admin SDK for emulators');
     // These env vars are set by the Firebase CLI
     if (process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
        console.log(`SERVER: Using Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
     }
     if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
         console.log(`SERVER: Using Auth Emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
     }
     return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.warn('SERVER: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server-side Firebase features will be limited.');
    return null;
  }
    
  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    // Check if the service account is the placeholder empty object
    if (!serviceAccount.project_id) {
         console.warn('SERVER: FIREBASE_SERVICE_ACCOUNT_KEY is a placeholder. Server-side Firebase features will be limited.');
         return null;
    }

     console.log('SERVER: Initializing Firebase Admin SDK with service account');
    return initializeApp({
      credential: Credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('SERVER: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
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
