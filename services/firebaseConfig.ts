
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
  
  // Dados Atualizados:
  messagingSenderId: "345642553254", 
  appId: "1:345642553254:web:63e9eafc63c28a34988967"
};

// Initialize Firebase with explicit 'any' types to avoid TS7034 errors
let app: any;
let auth: any;
let db: any;
let storage: any;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
    console.error("ERRO CRÍTICO FIREBASE:", error);
}

export { auth, db, storage };
