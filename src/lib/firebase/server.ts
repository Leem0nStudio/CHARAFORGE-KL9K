import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = (): App | null => {
  if (getApps().length > 0) {
    return getApp();
  }
  
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
     return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey || serviceAccountKey === "{}") {
    return null;
  }
    
  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    if (!serviceAccount.projectId) {
         return null;
    }
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: unknown) {
    return null;
  }
};

const adminApp = createFirebaseAdminApp();

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
