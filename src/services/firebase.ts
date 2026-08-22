import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration using user-provided API key
const firebaseConfig = {
  apiKey: "AIzaSyBrk_SwLwr6yyU0PHXUsr7sPCRMSUOo-TU",
  authDomain: "heallock-health.firebaseapp.com",
  projectId: "heallock-health",
  storageBucket: "heallock-health.appspot.com",
  messagingSenderId: "109283746182",
  appId: "1:109283746182:web:a918237461829374618293"
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
