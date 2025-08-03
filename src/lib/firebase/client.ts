// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
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
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);

export { app, auth };
