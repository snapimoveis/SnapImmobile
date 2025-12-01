import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
    query, where, limit, getDoc, setDoc 
} from 'firebase/firestore';
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, updateProfile, deleteUser 
} from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage'; // Importações do Storage
import { app } from './firebaseConfig';
import { Project, UserProfile, CompanySettings, Device, Invoice, Photo } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Inicializa Storage

// === HELPER: Upload de Imagem ===
const uploadImageToStorage = async (base64Image: string, path: string): Promise<string> => {
    // Se já for uma URL http, não faz nada
    if (base64Image.startsWith('http')) return base64Image;
    
    // Se for base64, faz upload
    const storageRef = ref(storage, path);
    try {
        await uploadString(storageRef, base64Image, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Erro ao fazer upload da imagem:", error);
        throw new Error("Falha no upload da imagem.");
    }
};

// === USER MANAGEMENT ===
// (Mantenha as funções de user iguais, vou focar no projeto)

export const registerUser = async (userProfile: UserProfile, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Senha é obrigatória para registro");
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

// === COMPANY SETTINGS ===
// (Mantenha igual)
export const getCompanySettings = async (): Promise<CompanySettings> => {
    const q = query(collection(db, "companies"), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data() as CompanySettings;
        const safeVirtualTourDays = Array.isArray(docData.virtualTourDays) ? docData.virtualTourDays : [];
        return { ...docData, id: querySnapshot.docs[0].id, virtualTourDays: safeVirtualTourDays };
    }
    return {
        id: 'default',
        name: 'Minha Imobiliária',
        primaryColor: '#623aa2',
        backgroundColor: '#ffffff',
        allowUserWatermark: true,
        virtualTourDays: [] 
    };
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<void> => {
    // Se tiver logo em base64, faz upload
    if (settings.logoUrl && settings.logoUrl.startsWith('data:')) {
        const path = `companies/${settings.id || 'default'}/logo_${Date.now()}`;
        settings.logoUrl = await uploadImageToStorage(settings.logoUrl, path);
    }

    if (settings.id && settings.id !== 'default') {
        await updateDoc(doc(db, "companies", settings.id), { ...settings });
    } else {
        await addDoc(collection(db, "companies"), settings);
    }
};

// === PROJECTS ===

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

// AQUI ESTÁ A CORREÇÃO PRINCIPAL PARA O ERRO DE TAMANHO
export const saveProject = async (project: Project): Promise<Project> => {
    const projectRef = doc(db, "projects", project.id);

    // 1. Processar Fotos (Upload de Base64 para Storage)
    // Não queremos salvar o base64 gigante no Firestore
    if (project.photos && project.photos.length > 0) {
        const processedPhotos: Photo[] = [];
        
        for (const photo of project.photos) {
            // Se a URL for data:image (base64), faz upload e substitui pela URL
            if (photo.url.startsWith('data:')) {
                const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
                console.log("Uploading photo to:", path);
                const publicUrl = await uploadImageToStorage(photo.url, path);
                processedPhotos.push({ ...photo, url: publicUrl });
            } else {
                processedPhotos.push(photo);
            }
        }
        project.photos = processedPhotos;
    }

    // 2. Processar Cover Image
    if (project.coverImage && project.coverImage.startsWith('data:')) {
        // Se a capa for uma das fotos já processadas, pega a URL dela
        const matchingPhoto = project.photos.find(p => p.id === project.coverImage || p.url === project.coverImage); // Simplificação
        
        // Se não achou ou é uma string base64 isolada, faz upload
        // Mas geralmente a capa é a URL da primeira foto
        if (project.photos.length > 0) {
            project.coverImage = project.photos[0].url;
        } else {
             const path = `projects/${project.id}/cover_${Date.now()}.jpg`;
             project.coverImage = await uploadImageToStorage(project.coverImage, path);
        }
    }

    // 3. Salvar no Firestore (agora com URLs curtas)
    const cleanProject = JSON.parse(JSON.stringify(project)); // Remove undefined
    await setDoc(projectRef, cleanProject, { merge: true });
    
    return project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await deleteDoc(doc(db, "projects", projectId));
};

// === BILLING & DEVICES (MOCK) ===
// (Mantenha igual)
export const getInvoices = async (): Promise<Invoice[]> => {
    return [
        { id: 'INV-001', number: '2025/001', date: '2025-10-01', amount: 29.90, status: 'paid' },
        { id: 'INV-002', number: '2025/002', date: '2025-11-01', amount: 29.90, status: 'pending' }
    ];
};

export const getDevices = async (): Promise<Device[]> => {
    return [
        { id: 'dev1', name: 'iPhone 15 Pro', type: 'mobile', model: 'iPhone 15 Pro', userName: 'Tania', lastAccess: Date.now(), lastActive: Date.now(), current: true, userId: 'user1', status: 'active' },
        { id: 'dev2', name: 'MacBook Air', type: 'desktop', model: 'M2', userName: 'Tania', lastAccess: Date.now() - 86400000, lastActive: Date.now() - 86400000, userId: 'user1', status: 'inactive' }
    ];
};
