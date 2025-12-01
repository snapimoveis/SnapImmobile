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

// === HELPER: Upload de Imagem Seguro ===
const uploadImageToStorage = async (base64Image: string | undefined, path: string): Promise<string> => {
    if (!base64Image) return '';
    // Se já é uma URL do Firebase ou http, não precisa de upload
    if (base64Image.startsWith('http') || base64Image.startsWith('https')) return base64Image;
    
    // Se não for base64 válido (ex: blob:), tenta converter ou ignora
    if (!base64Image.startsWith('data:image')) {
        console.warn("Formato de imagem não suportado para upload direto:", base64Image.substring(0, 20));
        return ''; 
    }
    
    try {
        const storageRef = ref(storage, path);
        // Upload da string base64
        await uploadString(storageRef, base64Image, 'data_url');
        // Obter a URL pública
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error("Erro crítico no upload da imagem:", error);
        // Em caso de erro, não podemos salvar o base64 gigante no Firestore
        throw new Error("Falha ao fazer upload da imagem. Verifique sua conexão.");
    }
};

// ... (Funções de User Management mantêm-se iguais) ...
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

// ... (Funções de Company Settings mantêm-se iguais) ...
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

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

// === CORREÇÃO CRÍTICA: SAVE PROJECT ===
export const saveProject = async (project: Project): Promise<Project> => {
    console.log("Iniciando salvamento do projeto:", project.id);
    
    // Cria uma cópia profunda para não mutar o estado original da UI
    // e para garantir que modificamos apenas o que vai para o banco
    const projectToSave = JSON.parse(JSON.stringify(project)) as Project;
    const projectRef = doc(db, "projects", project.id);

    // 1. Upload das Fotos do Projeto
    if (projectToSave.photos && projectToSave.photos.length > 0) {
        const processedPhotos: Photo[] = [];
        
        for (const photo of projectToSave.photos) {
            if (photo.url && photo.url.startsWith('data:')) {
                console.log(`Fazendo upload da foto ${photo.id}...`);
                const path = `projects/${project.id}/photos/${photo.id}_${Date.now()}.jpg`;
                const publicUrl = await uploadImageToStorage(photo.url, path);
                processedPhotos.push({ ...photo, url: publicUrl });
            } else {
                processedPhotos.push(photo);
            }
        }
        projectToSave.photos = processedPhotos;
    }

    // 2. Upload da Imagem de Capa (se for diferente das fotos ou se ainda estiver em base64)
    if (projectToSave.coverImage && projectToSave.coverImage.startsWith('data:')) {
        console.log("Fazendo upload da imagem de capa...");
        // Tenta encontrar se esta capa já foi salva como foto normal
        const existingPhoto = projectToSave.photos.find(p => p.id === project.coverImage || p.url === project.coverImage); // Usa project original para comparar IDs se necessário
        
        if (existingPhoto && existingPhoto.url.startsWith('http')) {
            // Se já existe uma foto salva, usa a URL dela
            projectToSave.coverImage = existingPhoto.url;
        } else {
            // Se é uma nova imagem isolada, faz upload
            const path = `projects/${project.id}/cover_${Date.now()}.jpg`;
            projectToSave.coverImage = await uploadImageToStorage(projectToSave.coverImage, path);
        }
    }

    // 3. Garantir que não enviamos undefined (Firebase não aceita)
    // O JSON.parse/stringify acima já removeu undefined, mas garantimos aqui
    const cleanData = Object.fromEntries(
        Object.entries(projectToSave).filter(([_, v]) => v !== undefined)
    );

    // 4. Salvar no Firestore
    console.log("Gravando dados no Firestore...");
    await setDoc(projectRef, cleanData, { merge: true });
    console.log("Projeto salvo com sucesso!");
    
    return projectToSave;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await deleteDoc(doc(db, "projects", projectId));
};

// ... (Funções Mock mantêm-se iguais) ...
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
