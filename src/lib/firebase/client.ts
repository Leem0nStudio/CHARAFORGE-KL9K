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
            // No hacer console.error aquí porque puede ejecutarse en el navegador.
            // Los errores se deben manejar donde se usa.
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
               // Silently fail in browser
            }
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
}

// Immediately initialize Firebase
try {
    initializeFirebase();
} catch (error: unknown) {
    // Fail gracefully if config is missing.
    // The app will show an error boundary or fail on a page that needs Firebase.
}


// Export the initialized instances
export { app, auth, db };
