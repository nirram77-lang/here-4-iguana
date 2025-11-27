import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA6laY3N84Pe_Fl1769bIoP4NbCxjmqP_o",
  // ✅ CRITICAL: Use Vercel domain as authDomain for mobile compatibility
  authDomain: "i4iguana-app.vercel.app",
  projectId: "i4iguana-89ed1",
  storageBucket: "i4iguana-89ed1.firebasestorage.app",
  messagingSenderId: "143460198551",
  appId: "1:143460198551:web:5db80d325a549f3e4661d2",
  measurementId: "G-CC0HZW3H0K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// ✅ Always prompt user to select account
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
