
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "charaforge-kl9ck",
  "appId": "1:347255894214:web:67952f04171bd3041867c7",
  "storageBucket": "charaforge-kl9ck.firebasestorage.app",
  "apiKey": "AIzaSyBXEP7Ni8Tj4jhVLUC_kreLT91g28y0dXQ",
  "authDomain": "charaforge-kl9ck.firebaseapp.com",
  "messagingSenderId": "347255894214"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === "localhost") {
  console.log("Connecting to Firebase Emulators");
  try {
     // Point to the emulators
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    console.error("Error connecting to Firebase emulators:", error);
  }
}

export { app, auth, db };
