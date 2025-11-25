
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
        
        // Normalize email to lowercase and trim
        const normalizedEmail = user.email.trim().toLowerCase();
        
        // Check if exists
        const checkReq = store.get(normalizedEmail);
        checkReq.onsuccess = () => {
            if (checkReq.result) {
                reject(new Error("Este e-mail já está registado."));
            } else {
                // Save user with password (unsafe for prod, ok for local demo)
                // Ensure the stored object uses the normalized email
                const userToSave: UserProfile = { 
                    ...user, 
                    email: normalizedEmail,
                    id: crypto.randomUUID(), 
                    password: password,
                    preferences: {
                        language: 'pt-PT',
                        notifications: true,
                        marketing: false,
                        theme: 'light'
                    }
                };
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
        
        // Normalize email to match registration
        const normalizedEmail = email.trim().toLowerCase();
        const request = store.get(normalizedEmail);
        
        request.onsuccess = () => {
            const user = request.result as UserProfile;
            
            if (!user) {
                reject(new Error("Utilizador não encontrado. Verifique o e-mail ou registe-se."));
            } else if (user.password === password) {
                resolve(user);
            } else {
                reject(new Error("Senha incorreta."));
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const updateUser = async (user: UserProfile): Promise<UserProfile> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        
        // We use email as key, so 'put' will update the existing record
        const request = store.put(user);
        
        request.onsuccess = () => resolve(user);
        request.onerror = () => reject(request.error);
    });
};

export const deleteUserAccount = async (email: string, userId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users', 'projects'], 'readwrite');
        
        // 1. Delete User
        const userStore = transaction.objectStore('users');
        userStore.delete(email);
        
        // 2. Delete all User Projects (Manual iteration needed since delete(index) isn't standard in simple API)
        const projectStore = transaction.objectStore('projects');
        const index = projectStore.index('userId');
        const projectReq = index.getAllKeys(IDBKeyRange.only(userId));
        
        projectReq.onsuccess = () => {
            const keys = projectReq.result;
            keys.forEach(key => {
                projectStore.delete(key);
            });
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
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
        const request = index.getAll(IDBKeyRange.only(userId)); // Filter by User ID
        
        request.onsuccess = () => {
            const projects = request.result as Project[];
            // Sort by date descending
            resolve(projects.sort((a, b) => b.createdAt - a.createdAt));
        };
        request.onerror = () => reject(request.error);
    });
};
