import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
} from "firebase/auth";

import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL
} from "firebase/storage";

import { app } from "./firebaseConfig";
import { Project, UserProfile, Photo } from "../types";

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ======================================================
// HELPER: UPLOAD
// ======================================================
const uploadImage = async (base64: string, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64, "data_url");
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error("Erro no upload:", err);
    throw err;
  }
};

// ======================================================
// USER MANAGEMENT
// ======================================================
export const registerUser = async (
  userProfile: UserProfile,
  password: string
): Promise<UserProfile> => {
  const cred = await createUserWithEmailAndPassword(
    auth,
    userProfile.email,
    password
  );

  const user = cred.user;
  await updateProfile(user, {
    displayName: `${userProfile.firstName} ${userProfile.lastName}`,
  });

  // Nunca armazenamos password
  const cleanUser: UserProfile = {
    ...userProfile,
    id: user.uid,
    password: undefined
  };

  await setDoc(doc(db, "users", user.uid), cleanUser as any);
  return cleanUser;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) return snap.data() as UserProfile;

  const newUser: UserProfile = {
    id: user.uid,
    email: user.email!,
    firstName: "User",
    lastName: "",
    role: "editor",
    createdAt: Date.now(),
    preferences: {
      language: "pt",
      notifications: true,
      marketing: false,
      theme: "light"
    }
  };

  await setDoc(doc(db, "users", user.uid), newUser as any);
  return newUser;
};

export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem("snap_user");
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem("snap_user");
  return stored ? JSON.parse(stored) : null;
};

export const saveUserSession = (user: UserProfile) => {
  localStorage.setItem("snap_user", JSON.stringify(user));
};

export const updateUser = async (updatedUser: UserProfile) => {
  const userRef = doc(db, "users", updatedUser.id);
  await updateDoc(userRef, updatedUser as any);
  return updatedUser;
};

export const deleteUserAccount = async (_email: string, userId: string) => {
  const user = auth.currentUser;

  await deleteDoc(doc(db, "users", userId));
  if (user) await deleteUser(user);

  localStorage.removeItem("snap_user");
};

// ======================================================
// PROJECTS
// ======================================================
export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as Project;
    return {
      ...data,
      id: d.id,
      photos: data.photos || [],
      coverImage: data.coverImage || null
    };
  });
};

// ======================================================
// SALVAR PROJETO — VERSÃO CORRIGIDA
// ======================================================
export const saveProject = async (project: Project): Promise<Project> => {
  const refProject = doc(db, "projects", project.id);

  const cleanProject: any = {
    id: project.id,
    userId: project.userId,
    title: project.title,
    address: project.address,
    status: project.status,
    createdAt: project.createdAt,
    details: project.details || {},
    coverImage: project.coverImage || null,
    photos: []
  };

  // --------------------
  // PROCESSAR FOTOS
  // --------------------
  for (const p of project.photos) {
    const out: any = {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt ?? Date.now(),
      type: p.type ?? "hdr",
      timestamp: p.timestamp ?? Date.now(),
      originalUrl: p.originalUrl ?? "",
      url: ""
    };

    if (p.url.startsWith("data:")) {
      const path = `projects/${project.id}/photos/${p.id}_${Date.now()}.jpg`;
      out.url = await uploadImage(p.url, path);
    } else {
      out.url = p.url;
    }

    cleanProject.photos.push(out);
  }

  // --------------------
  // CAPA
  // --------------------
  if (cleanProject.coverImage?.startsWith("data:")) {
    const coverPath = `projects/${project.id}/cover_${Date.now()}.jpg`;
    cleanProject.coverImage = await uploadImage(cleanProject.coverImage, coverPath);
  }

  // --------------------
  // GRAVAR NO FIRESTORE
  // --------------------
  await setDoc(refProject, cleanProject as any, { merge: true });

  return cleanProject as Project;
};

// ======================================================
// DELETE PROJECT
// ======================================================
export const deleteProject = async (projectId: string) => {
  await deleteDoc(doc(db, "projects", projectId));
};

// ======================================================
// MOCKS (compatibilidade futura)
// ======================================================
export const getCompanySettings = async () => ({});
export const saveCompanySettings = async () => {};
export const getInvoices = async () => [];
export const getDevices = async () => [];
