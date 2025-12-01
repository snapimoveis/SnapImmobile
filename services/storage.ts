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

const uploadImage = async (base64: string, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64, "data_url");
    return await getDownloadURL(storageRef);
};

// ---------------------------
// REGISTER
// ---------------------------
export const registerUser = async (userProfile: UserProfile, password: string): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, userProfile.email, password);
    const user = cred.user;

    await updateProfile(user, { displayName: `${userProfile.firstName} ${userProfile.lastName}` });

    const newUser = { ...userProfile, id: user.uid };
    await setDoc(doc(db, "users", user.uid), newUser);

    return newUser;
};

// ---------------------------
// LOGIN
// ---------------------------
export const loginUser = async (email: string, password: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) return snap.data() as UserProfile;

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

// ---------------------------
// SESSÃO
// ---------------------------
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

// ---------------------------
// UPDATE USER (CORRIGIDO)
// ---------------------------
export const updateUser = async (updatedUser: UserProfile) => {
    await setDoc(doc(db, "users", updatedUser.id), updatedUser, { merge: true });
    return updatedUser;
};

// ---------------------------
// DELETE USER
// ---------------------------
export const deleteUserAccount = async (_email: string, userId: string) => {
    const user = auth.currentUser;

    await deleteDoc(doc(db, "users", userId));
    if (user) await deleteUser(user);

    localStorage.removeItem("snap_user");
};

// ---------------------------
// PROJECTS
// ---------------------------
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
};

// ---------------------------
// SAVE PROJECT (CORRIGIDO COMPLETO)
// ---------------------------
export const saveProject = async (project: Project): Promise<Project> => {
    const projectRef = doc(db, "projects", project.id);

    const clean: any = {
        id: project.id,
        userId: project.userId,
        title: project.title,
        address: project.address,
        status: project.status,
        createdAt: project.createdAt,
        details: project.details || {},
        coverImage: project.coverImage ?? null,
        photos: []
    };

    for (const photo of project.photos ?? []) {
        const safePhoto: any = {
            id: photo.id,
            name: photo.name,
            type: photo.type ?? "hdr",
            createdAt: photo.createdAt ?? Date.now(),
            timestamp: photo.timestamp ?? Date.now(),
            url: ""
        };

        if (photo.url.startsWith("data:")) {
            safePhoto.url = await uploadImage(photo.url, `projects/${project.id}/photos/${photo.id}.jpg`);
        } else {
            safePhoto.url = photo.url;
        }

        clean.photos.push(safePhoto);
    }

    if (clean.coverImage?.startsWith("data:")) {
        clean.coverImage = await uploadImage(clean.coverImage, `projects/${project.id}/cover.jpg`);
    }

    await setDoc(projectRef, clean, { merge: true });
    return clean as Project;
};

export const deleteProject = async (projectId: string) => {
    await deleteDoc(doc(db, "projects", projectId));
};
