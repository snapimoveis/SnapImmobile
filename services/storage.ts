import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
    query, where, limit, getDoc, setDoc 
} from 'firebase/firestore';
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, updateProfile, deleteUser 
} from 'firebase/auth';
// Importações do Storage
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebaseConfig';
import { Project, UserProfile, CompanySettings, Device, Invoice, Photo } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// === HELPER: Upload de Imagem Seguro ===
const uploadImageToStorage = async (base64Image: string | undefined, path: string): Promise<string> => {
    if (!base64Image) return '';
    // Se já é uma URL curta (http...), retorna ela mesma
    if (base64Image.startsWith('http')) return base64Image;
    
    // Se não for imagem válida, retorna vazio para evitar erro de tamanho
    if (!base64Image.startsWith('data:image')) {
        console.warn("Imagem inválida para upload, ignorando.");
        return ''; 
    }
    
    try {
        const storageRef = ref(storage, path);
        // Upload da string gigante
        await uploadString(storageRef, base64Image, 'data_url');
        // Obter a URL curta e pública
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Erro no upload:", error);
        // Em caso de falha, retorna vazio para não travar o banco com base64 gigante
        return ''; 
    }
};

// ... (Funções de User Management mantêm-se iguais) ...

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

// ... (Company Settings) ...

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

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

// === CORREÇÃO DO SAVE PROJECT ===
export const saveProject = async (project: Project): Promise<Project> => {
    const projectRef = doc(db, "projects", project.id);
    // Clone para não alterar a UI
    const projectToSave = JSON.parse(JSON.stringify(project)) as Project;

    // 1. Processar Fotos (Upload Base64 -> URL)
    if (projectToSave.photos && projectToSave.photos.length > 0) {
        const processedPhotos: Photo[] = [];
        for (const photo of projectToSave.photos) {
            if (photo.url && photo.url.startsWith('data:')) {
                const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
                const publicUrl = await uploadImageToStorage(photo.url, path);
                // Se upload falhar, url fica vazia, mas evita erro de tamanho
                processedPhotos.push({ ...photo, url: publicUrl });
            } else {
                processedPhotos.push(photo);
            }
        }
        projectToSave.photos = processedPhotos;
    }

    // 2. Processar Capa
    if (projectToSave.coverImage && projectToSave.coverImage.startsWith('data:')) {
        // Verifica se a capa é uma das fotos já processadas
        const existingPhoto = projectToSave.photos.find(p => p.id === project.coverImage || p.url === project.coverImage);
        
        if (existingPhoto && existingPhoto.url.startsWith('http')) {
             projectToSave.coverImage = existingPhoto.url;
        } else {
             const path = `projects/${project.id}/cover_${Date.now()}.jpg`;
             projectToSave.coverImage = await uploadImageToStorage(projectToSave.coverImage, path);
        }
    }

    // 3. Salvar no Firestore (Agora seguro e leve)
    await setDoc(projectRef, projectToSave, { merge: true });
    return projectToSave;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await deleteDoc(doc(db, "projects", projectId));
};

// Mocks
export const getInvoices = async (): Promise<Invoice[]> => [];
export const getDevices = async (): Promise<Device[]> => [];
