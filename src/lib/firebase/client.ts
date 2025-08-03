import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
    if (!getApps().length) {
        if (!firebaseConfig.projectId) {
            throw new Error("Firebase configuration is incomplete. Please check your NEXT_PUBLIC_FIREBASE_* variables.");
        }
        
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
            try {
                connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
                connectFirestoreEmulator(db, '127.0.0.1', 8080);
            } catch (error: unknown) {
               console.error("Failed to connect to Firebase emulators.", error);
            }
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
}

try {
    initializeFirebase();
} catch (error: unknown) {
    console.error("Failed to initialize Firebase.", error);
}

export { app, auth, db };
