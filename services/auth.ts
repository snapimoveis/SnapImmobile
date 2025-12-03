// ================================
// Firebase Auth + Firestore Service
// ================================

import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { UserProfile, UserRole } from "../types";

// ================================
// Get user profile from Firestore
// ================================
async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ================================
// Register user
// ================================
export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: UserRole = "client"
): Promise<UserProfile> {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  const profile: UserProfile = {
    id: user.uid,
    firstName,
    lastName,
    email,
    role,
    createdAt: Date.now(),
    billing: {
      plan: "TRIAL",
      trial: {
        start: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxProperties: 5,
        maxPhotosPerProperty: 30,
      },
    },
  };

  await setDoc(doc(db, "users", user.uid), profile);
  return profile;
}

// ================================
// Login user
// ================================
export async function loginUser(
  email: string,
  password: string
): Promise<UserProfile> {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const user: User = userCred.user;

  const profile = await getUserProfile(user.uid);
  if (!profile) throw new Error("Utilizador sem perfil configurado.");

  return profile;
}

// ================================
// Logout
// ================================
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ================================
// Get current logged user
// ================================
export async function getCurrentUser(): Promise<UserProfile | null> {
  const current = auth.currentUser;
  if (!current) return null;

  return await getUserProfile(current.uid);
}
