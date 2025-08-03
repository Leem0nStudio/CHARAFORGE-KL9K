import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// This function ensures that the Firebase app is initialized only once.
const getFirebaseClient = (): { app: FirebaseApp; auth: Auth; db: Firestore } => {
  console.log('[client.ts] getFirebaseClient called.');
  if (getApps().length) {
    console.log('[client.ts] Existing Firebase App found.');
    const app = getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  console.log('[client.ts] Firebase Config:', firebaseConfig);


  const areClientVarsPresent =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId;

  if (!areClientVarsPresent) {
    console.error('[client.ts] Firebase client configuration is MISSING or incomplete.');
    // This will now throw an error to make it clear that the app cannot function without it.
    throw new Error('Firebase client configuration is missing. Please check your NEXT_PUBLIC_FIREBASE_* variables.');
  }
  
  console.log('[client.ts] Initializing new Firebase App...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    console.log('[client.ts] Using emulators for development.');
    try {
      console.log('[client.ts] Connecting to Auth Emulator...');
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
       console.log('[client.ts] Connecting to Firestore Emulator...');
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    } catch (error) {
       console.error('[client.ts] Error connecting to emulators:', error);
    }
  }

  return { app, auth, db };
};


// By exporting the function, we defer the initialization until it's first called,
// giving Next.js time to load environment variables.
const { app, auth, db } = getFirebaseClient();
export { app, auth, db };
