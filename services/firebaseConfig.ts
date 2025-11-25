
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
  // Chaves fornecidas por você:
  apiKey: "AIzaSyB3X2VAGQuSvEZ2vRPSuNs21TQL4UlPlNE",
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.firebasestorage.app",
  
  // --- DADOS FALTANTES (VOCÊ PRECISA PREENCHER) ---
  // Pegue estes dados no Console do Firebase > Configurações do Projeto > Geral > Seus Aplicativos
  messagingSenderId: "87654321000", // (Opcional, mas recomendado)
  appId: "1:87654321000:web:abcdef123456" // <--- COLE O SEU APP ID REAL AQUI
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase inicializado. Verifique se o appId está correto em services/firebaseConfig.ts");
} catch (error) {
    console.error("ERRO CRÍTICO FIREBASE: Verifique o appId em services/firebaseConfig.ts", error);
}

export { auth, db, storage };
