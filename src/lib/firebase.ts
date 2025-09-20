import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDb2i4UdzhB6ChT30ljwRXSIjBM8LMT318",
  authDomain: "blackbull-4b009.firebaseapp.com",
  projectId: "blackbull-4b009",
  storageBucket: "blackbull-4b009.firebasestorage.app",
  messagingSenderId: "600574134239",
  appId: "1:600574134239:web:377484c5db15edf320a66a",
  measurementId: "G-PS64KEQB6T"
};

console.log('🔥 Initializing Firebase...');

let auth;
let db;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Explicitly set persistence to LOCAL
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('✅ Firebase persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('❌ Error setting Firebase persistence:', error);
    });

  console.log('✅ Firebase initialized successfully');
  console.log('🔐 Auth ready');
  console.log('🗄️ Firestore ready');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export { auth, db };