// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

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
let auth: Auth;

// This check is important for Next.js a fast refresh feature.
if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

// Check if the app was initialized before getting auth
// This can sometimes fail in certain environments if not checked
try {
  auth = getAuth(app);
} catch (e) {
  console.error("Could not get Firebase Auth instance", e);
  // In a real app, you might want to handle this more gracefully
  // For now, we'll let it be undefined so the app doesn't crash,
  // but auth-related features will fail.
}


export { app, auth };
