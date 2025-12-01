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
  getDownloadURL,
} from "firebase/storage";

import { app } from "./firebaseConfig";
import { Project, UserProfile, Photo } from "../types";

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// -----------------------------------------------------
// UPLOAD SEGURO DE IMAGEM BASE64 → URL PÚBLICA
// -----------------------------------------------------
const uploadImage = async (base64: string, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64, "data_url");
  return await getDownloadURL(storageRef);
};

// -----------------------------------------------------
// SESSÃO LOCAL
// -----------------------------------------------------
export const saveUserSession = (user: UserProfile) => {
  localStorage.setItem("snap_user", JSON.stringify(user));
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem("snap_user");
  return stored ? (JSON.parse(stored) as UserProfile) : null;
};

// -----------------------------------------------------
// REGISTO DE UTILIZADOR
// -----------------------------------------------------
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

  const newUser: UserProfile = {
    ...userProfile,
    id: user.uid,
  };

  await setDoc(doc(db, "users", user.uid), newUser);
  return newUser;
};

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------
export const loginUser = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) return snap.data() as UserProfile;

  const fallback: UserProfile = {
    id: user.uid,
    firstName: "User",
    lastName: "",
    role: "editor",
    email: user.email || "",
    createdAt: Date.now(),
    preferences: {
      language: "pt",
      notifications: true,
      marketing: false,
      theme: "light",
    },
  };

  await setDoc(doc(db, "users", user.uid), fallback);
  return fallback;
};

// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------
export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem("snap_user");
};

// -----------------------------------------------------
// UPDATE USER (removendo undefineds)
// -----------------------------------------------------
export const updateUser = async (user: UserProfile): Promise<UserProfile> => {
  const cleanUser: any = {};

  Object.entries(user).forEach(([key, value]) => {
    if (value !== undefined) cleanUser[key] = value;
  });

  await updateDoc(doc(db, "users", user.id), cleanUser);
  return user;
};

// -----------------------------------------------------
// DELETE ACCOUNT
// -----------------------------------------------------
export const deleteUserAccount = async (email: string, userId: string) => {
  const user = auth.currentUser;

  await deleteDoc(doc(db, "users", userId));

  if (user) await deleteUser(user);
  localStorage.removeItem("snap_user");
};

// -----------------------------------------------------
// PROJECTS
// -----------------------------------------------------
export const getUserProjects = async (
  userId: string
): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Project[];
};

// -----------------------------------------------------
// SALVAR PROJETO (FINAL 100% TIP-SAFE)
// -----------------------------------------------------
export const saveProject = async (project: Project): Promise<Project> => {
  const projectRef = doc(db, "projects", project.id);

  const cleanProject: any = {
    id: project.id,
    userId: project.userId,
    title: project.title,
    address: project.address,
    status: project.status,
    createdAt: project.createdAt,
    details: project.details || {},
    coverImage: project.coverImage ?? null,
    photos: [],
  };

  // Processar fotos
  for (const photo of project.photos) {
    const safePhoto: any = {
      id: photo.id,
      name: photo.name,
      type: photo.type || "hdr",
      createdAt: photo.createdAt ?? Date.now(),
      timestamp: photo.timestamp ?? Date.now(),
    };

    if (photo.url.startsWith("data:")) {
      const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
      safePhoto.url = await uploadImage(photo.url, path);
    } else {
      safePhoto.url = photo.url;
    }

    cleanProject.photos.push(safePhoto);
  }

  // Upload capa
  if (cleanProject.coverImage && cleanProject.coverImage.startsWith("data:")) {
    const path = `projects/${project.id}/cover_${Date.now()}.jpg`;
    try {
      cleanProject.coverImage = await uploadImage(
        cleanProject.coverImage,
        path
      );
    } catch {
      cleanProject.coverImage = null;
    }
  }

  await setDoc(projectRef, cleanProject, { merge: true });
  return cleanProject as Project;
};

// -----------------------------------------------------
// DELETE PROJECT
// -----------------------------------------------------
export const deleteProject = async (projectId: string) => {
  await deleteDoc(doc(db, "projects", projectId));
};

// -----------------------------------------------------
// MOCKS — compatibilidade
// -----------------------------------------------------
export const getCompanySettings = async () => ({});
export const saveCompanySettings = async () => {};
export const getInvoices = async () => [];
export const getDevices = async () => [];
