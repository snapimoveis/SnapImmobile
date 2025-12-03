// ========================================================================
// services/auth.ts — Sistema de Autenticação LocalStorage
// 100% compatível com App.tsx e types.ts
// ========================================================================

import { UserProfile } from "../types";
import { loadUsers, saveUsers } from "./storage";

// ========================================================================
// KEYS
// ========================================================================
const CURRENT_USER_KEY = "snapimmobile_current_user";

// ========================================================================
// GET CURRENT USER
// ========================================================================
export function getCurrentUser(): UserProfile | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ========================================================================
// SAVE CURRENT USER
// ========================================================================
function setCurrentUser(user: UserProfile | null) {
  if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(CURRENT_USER_KEY);
}

// ========================================================================
// REGISTER
// ========================================================================
export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  cpf?: string;
}): Promise<UserProfile> {
  const users = loadUsers();

  // Verifica duplicatas
  if (users.some((u) => u.email === data.email)) {
    throw new Error("Este email já está registado.");
  }

  if (data.cpf && users.some((u) => u.cpf === data.cpf)) {
    throw new Error("Este CPF já está associado a outra conta.");
  }

  const newUser: UserProfile = {
    id: crypto.randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    password: data.password,
    cpf: data.cpf ?? "",
    createdAt: Date.now(),
    role: "client",
    billing: {
      plan: "TRIAL",
      trial: {
        start: Date.now(),
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3 dias trial
        maxProperties: 1,
        maxPhotosPerProperty: 20,
      },
    },
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUser(newUser);

  return newUser;
}

// ========================================================================
// LOGIN
// ========================================================================
export async function login(
  email: string,
  password: string
): Promise<UserProfile> {
  const users = loadUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) throw new Error("Email ou palavra-passe incorretos.");

  user.lastActive = Date.now();
  saveUsers(users);
  setCurrentUser(user);

  return user;
}

// ========================================================================
// LOGOUT
// ========================================================================
export async function logout(): Promise<void> {
  setCurrentUser(null);
}
