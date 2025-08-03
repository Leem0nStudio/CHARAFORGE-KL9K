import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

// Define a type for the return value for clarity
type FirebaseClientServices = {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
};

// A function to initialize and/or get the Firebase client services
export function getFirebaseClient(): FirebaseClientServices {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
        throw new Error("Firebase configuration is incomplete. Please check your NEXT_PUBLIC_FIREBASE_* variables.");
    }

    let app: FirebaseApp;

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    const auth = getAuth(app);
    const db = getFirestore(app);

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
        // Check if emulators are already connected to avoid re-connecting
        // This check is a bit tricky as Firebase SDK doesn't expose a clean way to check.
        // We'll rely on the SDK's internal idempotency.
        try {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
        } catch (error: unknown) {
           // It might throw if already connected. We can ignore this in dev mode.
           if (error instanceof Error && !error.message.includes("already connected")) {
               console.error("Failed to connect to Firebase emulators.", error);
           }
        }
    }

    return { app, auth, db };
}
