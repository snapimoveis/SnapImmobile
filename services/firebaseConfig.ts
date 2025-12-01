import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Usa variáveis de ambiente para tudo, mais seguro e flexível
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || "snap-immobile.firebaseapp.com",
  projectId: import.meta.env.VITE_PROJECT_ID || "snap-immobile",
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || "snap-immobile.appspot.com",
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Validação simples para evitar erros difíceis de rastrear
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key não encontrada! Verifique seu arquivo .env ou configurações do Vercel.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Exporta 'app' também caso seja necessário em algum lugar (como no storage.ts que corrigimos antes)
export { app };
