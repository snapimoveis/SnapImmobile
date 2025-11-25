
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile 
} from "firebase/auth";
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    Timestamp
} from "firebase/firestore";
import { 
    ref, 
    uploadString, 
    getDownloadURL, 
    deleteObject 
} from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";
import { Project, UserProfile, Photo } from '../types';

// --- Helper: Device Fingerprint (DeviceLocker) ---
const getUniqueDeviceId = () => {
    let deviceId = localStorage.getItem('snap_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('snap_device_id', deviceId);
    }
    return deviceId;
};

// --- Helper: Image Upload ---
// Uploads Base64 image to Firebase Storage and returns the public URL
const uploadPhotoToStorage = async (base64Data: string, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        // Upload as Data URL (Base64)
        await uploadString(storageRef, base64Data, 'data_url');
        return await getDownloadURL(storageRef);
    } catch (e) {
        console.error("Upload failed", e);
        // CRITICAL: Do NOT return base64Data here. 
        // Returning base64Data causes Firestore to try and save the massive string, hitting the 1MB limit and crashing.
        throw new Error("Falha no upload da imagem. Verifique a conexão ou permissões.");
    }
};

// --- User Methods (Firebase) ---

export const registerUser = async (user: UserProfile, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Password required for Firebase registration");

    const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
    const firebaseUser = userCredential.user;
    const deviceId = getUniqueDeviceId();

    const newUser: UserProfile = {
        ...user,
        id: firebaseUser.uid,
        deviceId: deviceId, // DeviceLocker Registration
        createdAt: Date.now(),
    };

    // Save extended profile to Firestore
    await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    
    return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Password required");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    try {
        // Fetch profile from Firestore
        const userDoc = await getDoc(doc(db, "users", uid));
        
        if (!userDoc.exists()) {
            console.warn("User profile not found in Firestore, creating fallback.");
            // Fallback: Return basic info if doc doesn't exist
            return {
                id: uid,
                email: email,
                role: 'Fotografo', // Default
                firstName: 'Utilizador',
                lastName: '',
                phone: '',
                cpf: '',
                createdAt: Date.now()
            };
        }

        const userData = userDoc.data() as UserProfile;
        
        // DeviceLocker Check
        const currentDeviceId = getUniqueDeviceId();
        if (userData.deviceId && userData.deviceId !== currentDeviceId) {
            // Security Rule: Block login from different device
            await signOut(auth);
            throw new Error("DEVICE_NOT_ALLOWED: Acesso negado. Esta conta está bloqueada ao dispositivo original.");
        }

        return userData;

    } catch (error: any) {
        // SOFT FAIL: If permission denied (Rules) or other DB error, return basic auth user
        // This allows login even if Firestore is locked
        if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
            console.warn("Firestore permission denied. Logging in with limited access.");
            return {
                id: uid,
                email: email,
                role: 'Fotografo',
                firstName: 'Utilizador',
                lastName: '(Modo Offline)',
                phone: '',
                cpf: '',
                createdAt: Date.now()
            };
        }
        throw error; // Re-throw other errors (like DeviceLocker)
    }
};

export const updateUser = async (user: UserProfile): Promise<UserProfile> => {
    const userRef = doc(db, "users", user.id);
    
    // If avatar is a new Base64 string, upload it first
    let avatarUrl = user.avatar;
    if (user.avatar && user.avatar.startsWith('data:image')) {
        try {
            avatarUrl = await uploadPhotoToStorage(user.avatar, `avatars/${user.id}_${Date.now()}.jpg`);
        } catch (e) {
            console.error("Avatar upload failed, continuing with text update");
            // Proceed without avatar update if upload fails
        }
    }

    const updatedUser = { ...user, avatar: avatarUrl };
    
    try {
        await updateDoc(userRef, updatedUser);
    } catch (e) {
        console.error("Failed to update Firestore profile", e);
        // Swallow error if it's just permission denied, but return updated object for UI
    }
    
    return updatedUser;
};

export const deleteUserAccount = async (email: string, userId: string): Promise<void> => {
    try {
        // 1. Delete User Projects
        const projects = await getUserProjects(userId);
        for (const p of projects) {
            await deleteProject(p.id);
        }

        // 2. Delete User Doc
        await deleteDoc(doc(db, "users", userId));

        // 3. Delete Auth Account
        if (auth.currentUser) {
            await auth.currentUser.delete();
        }
    } catch (e) {
        console.error("Delete account failed (likely permissions)", e);
        throw new Error("Não foi possível apagar a conta. Contacte o suporte.");
    }
};

export const logoutUser = async (): Promise<void> => {
    await signOut(auth);
    localStorage.removeItem('snap_user_session');
};

export const getCurrentUser = (): UserProfile | null => {
    // Firebase persists auth automatically, but for sync compatibility with App.tsx state:
    const session = localStorage.getItem('snap_user_session');
    return session ? JSON.parse(session) : null;
};

export const saveUserSession = (user: UserProfile) => {
    localStorage.setItem('snap_user_session', JSON.stringify(user));
};

// --- Project Methods (Firestore + Storage) ---

export const saveProject = async (project: Project): Promise<void> => {
    // Handle Photos: Upload Base64s to Storage and replace URLs
    const photosWithStorageUrls: Photo[] = [];
    
    for (const photo of project.photos) {
        let finalUrl = photo.url;
        
        // Only upload if it's still a Base64 string (new photo)
        if (photo.url.startsWith('data:image')) {
            const path = `projects/${project.userId}/${project.id}/${photo.id}.jpg`;
            finalUrl = await uploadPhotoToStorage(photo.url, path);
        }
        
        photosWithStorageUrls.push({ ...photo, url: finalUrl });
    }

    // Handle Cover Image
    let coverImageUrl = project.coverImage;
    if (coverImageUrl && coverImageUrl.startsWith('data:image')) {
         // If cover is one of the photos, try to find its new URL
         const matchingPhoto = photosWithStorageUrls.find(p => project.photos.find(old => old.url === coverImageUrl)?.id === p.id);
         if (matchingPhoto) {
             coverImageUrl = matchingPhoto.url;
         } else {
             const path = `projects/${project.userId}/${project.id}/cover_${Date.now()}.jpg`;
             coverImageUrl = await uploadPhotoToStorage(coverImageUrl, path);
         }
    }

    const projectToSave = {
        ...project,
        photos: photosWithStorageUrls,
        coverImage: coverImageUrl
    };

    await setDoc(doc(db, "projects", project.id), projectToSave);
};

export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        const docRef = doc(db, "projects", projectId);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            await deleteDoc(docRef);
        }
    } catch (e) {
        console.error("Delete project failed", e);
    }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    try {
        const q = query(collection(db, "projects"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const projects: Project[] = [];
        querySnapshot.forEach((doc) => {
            projects.push(doc.data() as Project);
        });
        
        return projects.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            console.warn("Firestore project read denied. Returning empty list.");
            return [];
        }
        console.error("Get projects failed", e);
        throw e;
    }
};
