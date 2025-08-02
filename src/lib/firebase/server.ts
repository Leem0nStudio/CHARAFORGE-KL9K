import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const createFirebaseAdminApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );

  return initializeApp({
    credential: {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    },
  });
};

export const admin: App = createFirebaseAdminApp();
export const adminAuth = getAuth(admin);
export const adminDb = getFirestore(admin);
