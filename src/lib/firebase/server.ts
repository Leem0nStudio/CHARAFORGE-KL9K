import { initializeApp, getApps, getApp, App, ServiceAccount, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = () => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server-side Firebase features will be disabled.');
  }
    
  if (getApps().length > 0) {
    return getApp();
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
  try {
    return getFirestore(adminApp);
  } catch (e) {
    console.error("Failed to get Firestore instance", e)
    return null;
  }
};

const getAdminAuth = () => {
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
