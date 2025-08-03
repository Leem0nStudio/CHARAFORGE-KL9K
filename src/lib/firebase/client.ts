import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// More robust check for all required client-side variables
const areClientVarsPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (areClientVarsPresent) {
  // Initialize Firebase only if config is fully present
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  // Connect to emulators if in development
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
    console.log('CLIENT: Connecting to Firebase Emulators');
    try {
      // Note: Emulators must be running for this to succeed
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    } catch (error) {
      console.error('Error connecting to Firebase Emulators (Client):', error);
    }
  }
} else {
  console.error(
    'Firebase client configuration is missing or incomplete. Make sure NEXT_PUBLIC_FIREBASE_* environment variables are set in your .env.local file. Client-side Firebase features will be disabled.'
  );
}

export { app, auth, db };
