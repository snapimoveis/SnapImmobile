// services/auth.ts
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";

import { auth, db } from "./firebaseConfig";

import { UserProfile } from "../types";

// ------------------------------------------------------------
// Carrega perfil do usuário autenticado
// ------------------------------------------------------------
export async function getCurrentUser(): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as UserProfile;
}

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------
export async function loginUser(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = result.user;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Perfil não encontrado no Firestore.");
  }

  return snap.data() as UserProfile;
}

// ------------------------------------------------------------
// Registo de usuário
// ------------------------------------------------------------
export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = result.user;

  const profile: UserProfile = {
    id: firebaseUser.uid,
    firstName,
    lastName,
    email,
    role: "client",
    billing: {
      plan: "TRIAL",
      trial: {
        start: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxPhotosPerProperty: 30,
        maxProperties: 5,
      }
    },
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "users", firebaseUser.uid), profile);

  return profile;
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
export async function logoutUser() {
  await signOut(auth);
}
