import { initializeApp, getApps, getApp, App, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    // This console.warn is important for debugging in environments where the key isn't set.
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Server-side Firebase features will be disabled.');
    return null;
  }

  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      },
    });
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    // Return null or a mock app to prevent hard crash
    return null;
  }
};

const adminApp = createFirebaseAdminApp();

// Use a function to get the db/auth instance to handle the case where adminApp is null.
const getAdminDb = () => {
  if (!adminApp) return null;
  try {
    return getFirestore(adminApp);
  } catch (e) {
    return null;
  }
};

const getAdminAuth = () => {
    if (!adminApp) return null;
    try {
        return getAuth(adminApp);
    } catch(e) {
        return null;
    }
}


export const admin = adminApp;
export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
