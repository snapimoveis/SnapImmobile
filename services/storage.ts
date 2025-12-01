import { 
    getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, 
    query, where, getDoc, setDoc 
} from 'firebase/firestore';

import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, updateProfile, deleteUser 
} from 'firebase/auth';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

import { app } from './firebaseConfig';
import { Project, UserProfile, Photo } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// -------------------------------
// Helper seguro para upload
// -------------------------------
const uploadImage = async (base64: string, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        await uploadString(storageRef, base64, "data_url");
        return await getDownloadURL(storageRef);
    } catch (e) {
        console.error("Erro ao fazer upload:", e);
        throw e;
    }
};

// -------------------------------
// USER MANAGEMENT
// -------------------------------
export const registerUser = async (userProfile: UserProfile, password: string): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, userProfile.email, password);
    const user = cred.user;

    await updateProfile(user, { displayName: `${userProfile.firstName} ${userProfile.lastName}` });

    const newUser = { ...userProfile, id: user.uid };
    await setDoc(doc(db, "users", user.uid), newUser);

    return newUser;
};

export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) return snap.data() as UserProfile;

    // fallback
    const profile: UserProfile = {
        id: user.uid,
        email: user.email!,
        firstName: "User",
        lastName: "",
        role: "editor",
        createdAt: Date.now(),
        preferences: { language: "pt", notifications: true, marketing: false, theme: "light" }
    };

    await setDoc(doc(db, "users", user.uid), profile);
    return profile;
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
    await updateDoc(doc(db, "users", updatedUser.id), updatedUser);
    return updatedUser;
};

export const deleteUserAccount = async (_email: string, userId: string) => {
    const user = auth.currentUser;

    await deleteDoc(doc(db, "users", userId));
    if (user) await deleteUser(user);

    localStorage.removeItem("snap_user");
};

// -------------------------------
// PROJECTS
// -------------------------------
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
};

// -------------------------------
// SALVAR PROJETO — *VERSÃO FINAL*
// -------------------------------
export const saveProject = async (project: Project): Promise<Project> => {
    const projectRef = doc(db, "projects", project.id);

    // Construir objeto seguro (sem base64, sem undefined)
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

    // -------------------------------
    // Processar cada foto
    // -------------------------------
    for (const photo of project.photos) {
        const safePhoto: any = {
            id: photo.id,
            name: photo.name,
            createdAt: photo.createdAt,
            type: photo.type || "hdr",
            timestamp: photo.timestamp || Date.now(),
            url: ""
        };

        // Upload se for base64
        if (photo.url.startsWith("data:")) {
            const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
            safePhoto.url = await uploadImage(photo.url, path);
        } else {
            safePhoto.url = photo.url;
        }

        // Remover campos inválidos
        delete safePhoto.originalUrl;

        cleanProject.photos.push(safePhoto);
    }

    // -------------------------------
    // Upload da imagem de capa
    // -------------------------------
    if (cleanProject.coverImage && cleanProject.coverImage.startsWith("data:")) {
        const coverPath = `projects/${project.id}/cover_${Date.now()}.jpg`;
        try {
            cleanProject.coverImage = await uploadImage(cleanProject.coverImage, coverPath);
        } catch {
            cleanProject.coverImage = null;
        }
    }

    // Grava projeto final (somente dados válidos)
    await setDoc(projectRef, cleanProject, { merge: true });

    return cleanProject as Project;
};

// -------------------------------
// DELETAR PROJETO
// -------------------------------
export const deleteProject = async (projectId: string) => {
    await deleteDoc(doc(db, "projects", projectId));
};

// -------------------------------
// MOCKS (compatibilidade)
// -------------------------------
export const getCompanySettings = async () => ({});
export const saveCompanySettings = async () => {};
export const getInvoices = async () => [];
export const getDevices = async () => [];
