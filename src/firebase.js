// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCcFBichE6X1r6NRyrJJ9nPNfu-8yHVMAg",
  authDomain: "event-managment-app-6fa14.firebaseapp.com",
  projectId: "event-managment-app-6fa14",
  storageBucket: "event-managment-app-6fa14.firebasestorage.app",
  messagingSenderId: "38550599391",
  appId: "1:38550599391:web:2c2c51bb9e1ebecf485b6a",
  measurementId: "G-07SSEDYG5D"
};



const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
