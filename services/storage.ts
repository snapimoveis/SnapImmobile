
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
        return base64Data; // Fallback to base64 if upload fails (not recommended for production)
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

    // Fetch profile from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    
    if (!userDoc.exists()) {
        throw new Error("Perfil de usuário não encontrado.");
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
};

export const updateUser = async (user: UserProfile): Promise<UserProfile> => {
    const userRef = doc(db, "users", user.id);
    
    // If avatar is a new Base64 string, upload it first
    let avatarUrl = user.avatar;
    if (user.avatar && user.avatar.startsWith('data:image')) {
        avatarUrl = await uploadPhotoToStorage(user.avatar, `avatars/${user.id}_${Date.now()}.jpg`);
    }

    const updatedUser = { ...user, avatar: avatarUrl };
    await updateDoc(userRef, updatedUser);
    
    return updatedUser;
};

export const deleteUserAccount = async (email: string, userId: string): Promise<void> => {
    // This is complex in Firebase Client SDK. 
    // Ideally, use a Cloud Function to delete all user data (recursive delete).
    // Here we do a simple client-side cleanup.
    
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
             coverImageUrl = await uploadPhotoToStorage(coverImageUrl, `projects/${project.userId}/${project.id}/cover.jpg`);
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
    // 1. Get project to find photo URLs (to delete from storage)
    const docRef = doc(db, "projects", projectId);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
        const project = snapshot.data() as Project;
        // Best effort delete images from storage
        // Note: Client SDK cannot delete folders, must delete files individually
        // This is better handled by a Cloud Function trigger in production
        
        // 2. Delete Document
        await deleteDoc(docRef);
    }
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
        projects.push(doc.data() as Project);
    });
    
    return projects.sort((a, b) => b.createdAt - a.createdAt);
};
