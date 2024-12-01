import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAOB1oDrYwu2q0vaP9tRe2uN5dv61ed66g",
  authDomain: "zellak-ce065.firebaseapp.com",
  projectId: "zellak-ce065",
  storageBucket: "zellak-ce065.appspot.com",
  messagingSenderId: "524842230470",
  appId: "1:524842230470:web:e71316dc706f27baaa6dc7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to avoid timestamp warnings
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
});

// Get Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
export { db };