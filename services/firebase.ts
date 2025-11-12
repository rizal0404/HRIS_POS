// IMPORTANT: Replace this with your own Firebase project configuration..
// You can find this in your Firebase project settings.
// For security in a real production app, use environment variables instead of hardcoding.
const firebaseConfig = {
  apiKey: "AIzaSyCfT8gYiySaZYSkI2krikfzkIZMoVWYgMg",
  authDomain: "manajemenpos.firebaseapp.com",
  projectId: "manajemenpos",
  storageBucket: "manajemenpos.firebasestorage.app",
  messagingSenderId: "635321008879",
  appId: "1:635321008879:web:ed1b101919c4c05b6f511a"
};


// Fix: Module '"firebase/app"' has no exported member 'initializeApp'. This error indicates a
// project setup that's incompatible with the Firebase v9 modular SDK. Reverting to the v8
// compatibility syntax to resolve module loading issues.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize and export Firebase services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const { Timestamp } = firebase.firestore;
