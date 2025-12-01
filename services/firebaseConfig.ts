import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.firebasestorage.app",
  messagingSenderId: "345642553254",
  appId: "1:345642553254:web:63e9eafc63c28a34988967"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
