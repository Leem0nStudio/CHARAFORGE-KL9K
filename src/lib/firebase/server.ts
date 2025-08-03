import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = (): App | null => {
  if (getApps().length > 0) {
    return getApp();
  }
  
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
     console.log('[server.ts] Initializing Admin App for EMULATORS.');
     return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error('[server.ts] FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Server features will be disabled.');
    return null;
  }
    
  if (serviceAccountKey === "{}") {
    console.warn('[server.ts] FIREBASE_SERVICE_ACCOUNT_KEY is an empty JSON object. Server-side features will be limited.');
    return null;
  }
    
  try {
    const sanitizedKey = serviceAccountKey.replace(/\\n/g, '\n');
    const serviceAccount: ServiceAccount = JSON.parse(sanitizedKey);

    if (!serviceAccount.projectId) {
         console.error('[server.ts] Service account JSON is missing projectId. Server features will be disabled.');
         return null;
    }
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[server.ts] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it's a valid, single-line JSON string. Error: ${errorMessage}`);
    return null;
  }
};

const adminApp = createFirebaseAdminApp();

const getAdminDb = (): Firestore | null => {
  if (!adminApp) {
    return null;
  }
  try {
    return getFirestore(adminApp);
  } catch (e) {
    console.error('[server.ts] Failed to get Firestore instance:', e);
    return null;
  }
};

const getAdminAuth = (): Auth | null => {
    if (!adminApp) {
        return null;
    }
    try {
        return getAuth(adminApp);
    } catch(e) {
        console.error('[server.ts] Failed to get Auth instance:', e);
        return null;
    }
}

export const admin: App | null = adminApp;
export const adminDb: Firestore | null = getAdminDb();
export const adminAuth: Auth | null = getAdminAuth();
