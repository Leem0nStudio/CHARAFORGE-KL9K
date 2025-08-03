import { initializeApp, getApps, getApp, App, ServiceAccount, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = (): App | null => {
  console.log('[server.ts] Attempting to create Firebase Admin App...');
  if (getApps().length > 0) {
    console.log('[server.ts] Existing Firebase Admin App found.');
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
    // This is the crucial fix: It replaces newline characters with escaped newlines
    // so the JSON can be parsed correctly, even if copied directly from the Firebase console.
    const sanitizedKey = serviceAccountKey.replace(/\n/g, '\\n');
    const serviceAccount: ServiceAccount = JSON.parse(sanitizedKey);

    if (!serviceAccount.projectId) {
         console.error('[server.ts] Service account JSON is missing projectId. Server features will be disabled.');
         return null;
    }
    console.log(`[server.ts] Initializing Admin App for project: ${serviceAccount.projectId}`);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error: unknown) {
    // Provide a more detailed error message for easier debugging.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[server.ts] FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it's a valid, single-line JSON string. Error: ${errorMessage}`);
    return null;
  }
};

const adminApp = createFirebaseAdminApp();

const getAdminDb = (): Firestore | null => {
  if (!adminApp) {
    console.log('[server.ts] Admin App not available, Firestore cannot be initialized.');
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
        console.log('[server.ts] Admin App not available, Auth cannot be initialized.');
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

if (admin) console.log('[server.ts] Firebase Admin SDK initialized.');
if (adminDb) console.log('[server.ts] Firestore for Admin is available.');
if (adminAuth) console.log('[server.ts] Auth for Admin is available.');
