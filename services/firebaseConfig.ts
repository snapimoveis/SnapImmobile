import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuração do Firebase
// IMPORTANTE: Substitua pelas suas chaves reais do Console do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY || "SUA_API_KEY_AQUI",
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Inicialização e EXPORTAÇÃO explícita
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
