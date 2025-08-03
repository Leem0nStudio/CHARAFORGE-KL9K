

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

// Validate that all client-side environment variables are present
const areClientVarsPresent = 
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'changeme' &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!areClientVarsPresent) {
  console.error(
    'Firebase client configuration is missing or incomplete. Make sure NEXT_PUBLIC_FIREBASE_* environment variables are set in your .env file. Client-side Firebase features will be disabled.'
  );
  // Provide dummy instances if config is not present to avoid app crash
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
    // Initialize Firebase
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators if in development
    if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      console.log('CLIENT: Connecting to Firebase Emulators');
      try {
        const authHost = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST || '127.0.0.1';
        const authPort = parseInt(process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || '9099');
        connectAuthEmulator(auth, `http://${authHost}:${authPort}`);

        const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
        const firestorePort = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080');
        connectFirestoreEmulator(db, firestoreHost, firestorePort);
      } catch (error) {
        console.error('Error connecting to Firebase Emulators (Client):', error);
      }
    }
}

export { app, auth, db };
