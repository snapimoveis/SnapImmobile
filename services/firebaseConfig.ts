
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// CONFIGURAÇÃO DO FIREBASE
// Nota: Esta API KEY é diferente da chave do Gemini (IA).
const firebaseConfig = {
  apiKey: "AIzaSyB3X2VAGQuSvEZ2vRPSuNs21TQL4UlPlNE", // Chave específica do Firebase
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.firebasestorage.app",
  messagingSenderId: "87654321000", // Exemplo (Substitua pelo real se tiver)
  appId: "1:87654321000:web:abcdef123456" // ATENÇÃO: VOCÊ PRECISA COLOCAR O SEU APP ID AQUI (Ver Console do Firebase)
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
    console.log("Firebase conectado com sucesso.");
} catch (error) {
    console.error("Erro ao conectar Firebase. Verifique o appId no arquivo services/firebaseConfig.ts", error);
}

export { auth, db, storage };
