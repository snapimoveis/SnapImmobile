// services/firebaseConfig.ts
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
  FirebaseOptions,
} from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.appspot.com",
  messagingSenderId: "345642553254",
  appId: "1:345642553254:web:63e9eafc63c28a34988967",
};

let app: FirebaseApp;

// 🔒 Inicialização segura — nunca quebra por "duplicate-app"
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err: any) {
    if (err?.code === "app/duplicate-app") {
      console.warn(
        "[firebaseConfig] App já existe, reutilizando instância existente."
      );
      app = getApp();
    } else {
      console.error("[firebaseConfig] Erro ao inicializar Firebase:", err);
      throw err;
    }
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export { app };



