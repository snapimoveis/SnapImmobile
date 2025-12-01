import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <--- Importante

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "snap-immobile.firebaseapp.com",
  projectId: import.meta.env.VITE_PROJECT_ID || "snap-immobile",
  storageBucket: "snap-immobile.firebasestorage.app", // <--- VERIFIQUE ISTO
  // Nota: O formato do bucket é geralmente "project-id.firebasestorage.app"
  // Se estiver usando 'appspot.com' (padrão antigo) pode funcionar, mas verifique no console
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <--- Importante
export { app };
