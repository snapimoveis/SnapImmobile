
import { Project, UserProfile } from '../types';

const DB_NAME = 'SnapImmobileDB';
const DB_VERSION = 1;

// --- IndexedDB Helpers ---

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Store Projects
            if (!db.objectStoreNames.contains('projects')) {
                const store = db.createObjectStore('projects', { keyPath: 'id' });
                store.createIndex('userId', 'userId', { unique: false });
            }
            
            // Store Users
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'email' }); // Using email as key for simplicity
            }
        };
    });
};

// --- User Methods (Local) ---

export const registerUser = async (user: UserProfile, password?: string): Promise<UserProfile> => {
    // Simulate async API
    await new Promise(r => setTimeout(r, 500));
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // Check if exists
        const checkReq = store.get(user.email);
        checkReq.onsuccess = () => {
            if (checkReq.result) {
                reject(new Error("Utilizador já existe."));
            } else {
                // Save user with password (unsafe for prod, ok for local demo)
                const userToSave = { ...user, id: crypto.randomUUID(), password: password };
                store.add(userToSave);
                resolve(userToSave);
            }
        };
        checkReq.onerror = () => reject(checkReq.error);
    });
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    await new Promise(r => setTimeout(r, 500));
    
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.get(email);
        
        request.onsuccess = () => {
            const user = request.result as UserProfile;
            if (user && user.password === password) {
                resolve(user);
            } else {
                reject(new Error("Credenciais inválidas."));
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const logoutUser = async (): Promise<void> => {
    localStorage.removeItem('snap_user_session');
};

export const getCurrentUser = (): UserProfile | null => {
    const session = localStorage.getItem('snap_user_session');
    return session ? JSON.parse(session) : null;
};

export const saveUserSession = (user: UserProfile) => {
    localStorage.setItem('snap_user_session', JSON.stringify(user));
};

// --- Project Methods (IndexedDB) ---

export const saveProject = async (project: Project): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.put(project); // put updates or inserts
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.delete(projectId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const index = store.index('userId');
        // In a real app we filter by userId, but for local demo we can just get all or filter in JS if index is tricky
        const request = index.getAll(IDBKeyRange.only(userId)); // Filter by User ID
        
        request.onsuccess = () => {
            const projects = request.result as Project[];
            // Sort by date descending
            resolve(projects.sort((a, b) => b.createdAt - a.createdAt));
        };
        request.onerror = () => reject(request.error);
    });
};
