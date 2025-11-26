import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB3X2VAGQuSvEZ2vRPSuNs21TQL4UlPlNE",
  authDomain: "snap-immobile.firebaseapp.com",
  projectId: "snap-immobile",
  storageBucket: "snap-immobile.firebasestorage.app",
  messagingSenderId: "345642553254", 
  appId: "1:345642553254:web:63e9eafc63c28a34988967"
};

let app: any;
let auth: any;
let db: any;
let storage: any;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (error) {
    console.error("Firebase Init Error:", error);
}

export { auth, db, storage };