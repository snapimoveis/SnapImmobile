import { 
    getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
    query, where, orderBy, limit, getDoc, setDoc 
} from 'firebase/firestore';
import { 
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
    signOut, updateProfile, deleteUser 
} from 'firebase/auth';
import { app } from './firebaseConfig';
import { Project, UserProfile, CompanySettings, Device, Invoice } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);

// === USER MANAGEMENT ===

export const registerUser = async (userProfile: UserProfile, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Senha é obrigatória para registro");
    
    // 1. Criar Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, userProfile.email, password);
    const user = userCredential.user;

    // 2. Atualizar Perfil Auth
    await updateProfile(user, { displayName: `${userProfile.firstName} ${userProfile.lastName}` });

    // 3. Salvar Perfil no Firestore
    const newUser: UserProfile = { ...userProfile, id: user.uid };
    await setDoc(doc(db, "users", user.uid), newUser);

    return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Senha obrigatória");
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Buscar dados extras do Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        
        // Verificação de Segurança de Dispositivo (Simulada)
        if (userData.deviceId && userData.deviceId !== 'current-device-id') {
             // Lógica real de device check aqui
        }
        
        return userData;
    } else {
        // Fallback se não existir doc (cria básico)
        const newProfile: UserProfile = {
            id: user.uid,
            email: user.email!,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            role: 'editor', // Role padrão seguro
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

export const getCompanySettings = async (): Promise<CompanySettings> => {
    // Simulação: Pegar a primeira empresa ou criar padrão
    const q = query(collection(db, "companies"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data() as CompanySettings;
        return { ...docData, id: querySnapshot.docs[0].id };
    }
    
    return {
        id: 'default',
        name: 'Minha Imobiliária',
        primaryColor: '#623aa2',
        backgroundColor: '#ffffff',
        allowUserWatermark: true,
        virtualTourDays: 30
    };
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<void> => {
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

export const saveProject = async (project: Project): Promise<Project> => {
    if (project.id && (await getDoc(doc(db, "projects", project.id))).exists()) {
        await updateDoc(doc(db, "projects", project.id), { ...project });
        return project;
    } else {
        // Se for novo, deixa o Firestore gerar o ID se não tiver, ou usa o fornecido
        const docRef = await addDoc(collection(db, "projects"), project);
        return { ...project, id: docRef.id };
    }
};

export const deleteProject = async (projectId: string): Promise<void> => {
    await deleteDoc(doc(db, "projects", projectId));
};

// === BILLING & DEVICES (MOCK) ===

export const getInvoices = async (): Promise<Invoice[]> => {
    // Mock data for UI development
    return [
        { id: 'INV-001', date: '2025-10-01', amount: 29.90, status: 'paid' },
        { id: 'INV-002', date: '2025-11-01', amount: 29.90, status: 'pending' }
    ];
};

export const getDevices = async (): Promise<Device[]> => {
    return [
        { id: 'dev1', name: 'iPhone 15 Pro', type: 'mobile', lastActive: Date.now(), current: true, userId: 'user1' },
        { id: 'dev2', name: 'MacBook Air', type: 'desktop', lastActive: Date.now() - 86400000, userId: 'user1' }
    ];
};
