import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
    query, where, limit, getDoc, setDoc 
} from 'firebase/firestore';
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, updateProfile, deleteUser 
} from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebaseConfig';
import { Project, UserProfile, CompanySettings, Device, Invoice, Photo } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// === HELPER: Upload de Imagem ===
const uploadImageToStorage = async (base64Image: string | undefined, path: string): Promise<string> => {
    if (!base64Image) return '';
    if (base64Image.startsWith('http')) return base64Image;
    
    try {
        const storageRef = ref(storage, path);
        await uploadString(storageRef, base64Image, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Erro no upload:", error);
        throw error;
    }
};

// === USER MANAGEMENT ===

export const registerUser = async (userProfile: UserProfile, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Senha obrigatória");
    const userCredential = await createUserWithEmailAndPassword(auth, userProfile.email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: `${userProfile.firstName} ${userProfile.lastName}` });
    const newUser: UserProfile = { ...userProfile, id: user.uid };
    await setDoc(doc(db, "users", user.uid), newUser);
    return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Senha obrigatória");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    } else {
        const newProfile: UserProfile = {
            id: user.uid,
            email: user.email!,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            role: 'editor', 
            createdAt: Date.now(),
            preferences: { language: 'pt', notifications: true, marketing: false, theme: 'light' }
        };
        await setDoc(doc(db, "users", user.uid), newProfile);
        return newProfile;
    }
};

export const logoutUser = async () => {
    await signOut(auth);
    localStorage.removeItem('snap_user');
};

export const getCurrentUser = (): UserProfile | null => {
    const stored = localStorage.getItem('snap_user');
    return stored ? JSON.parse(stored) : null;
};

export const saveUserSession = (user: UserProfile) => {
    localStorage.setItem('snap_user', JSON.stringify(user));
};

export const updateUser = async (updatedUser: UserProfile): Promise<UserProfile> => {
    const userRef = doc(db, "users", updatedUser.id);
    await updateDoc(userRef, { ...updatedUser });
    return updatedUser;
};

export const deleteUserAccount = async (email: string, userId: string) => {
    const user = auth.currentUser;
    if (user) {
        await deleteDoc(doc(db, "users", userId));
        await deleteUser(user);
        localStorage.removeItem('snap_user');
    }
};

// === PROJECTS ===

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const saveProject = async (project: Project): Promise<Project> => {
    const projectRef = doc(db, "projects", project.id);
    const projectToSave = JSON.parse(JSON.stringify(project)) as Project;

    // Upload de Fotos
    if (projectToSave.photos && projectToSave.photos.length > 0) {
        const processedPhotos: Photo[] = [];
        for (const photo of projectToSave.photos) {
            if (photo.url && photo.url.startsWith('data:')) {
                const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
                try {
                    const publicUrl = await uploadImageToStorage(photo.url, path);
                    processedPhotos.push({ ...photo, url: publicUrl });
                } catch (e) {
                    console.warn("Falha no upload da foto, mantendo local:", e);
                    processedPhotos.push(photo); // Mantém base64 se falhar upload para não perder dados
                }
            } else {
                processedPhotos.push(photo);
            }
        }
        projectToSave.photos = processedPhotos;
    }

    // Upload Capa
    if (projectToSave.coverImage && projectToSave.coverImage.startsWith('data:')) {
        const path = `projects/${project.id}/cover_${Date.now()}.jpg`;
        try {
            projectToSave.coverImage = await uploadImageToStorage(projectToSave.coverImage, path);
        } catch (e) {
             console.warn("Falha no upload da capa");
        }
    }

    await setDoc(projectRef, projectToSave, { merge: true });
    return projectToSave;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await deleteDoc(doc(db, "projects", projectId));
};

// === MOCKS (Para evitar erros de importação em outros ficheiros) ===
export const getCompanySettings = async () => ({});
export const saveCompanySettings = async () => {};
export const getInvoices = async () => [];
export const getDevices = async () => [];
