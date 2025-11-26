
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
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
    getDocs 
} from "firebase/firestore/lite";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "firebase/storage";
import { auth, db, storage } from "./firebaseConfig";
import { Project, UserProfile, Photo, CompanySettings, Device, Invoice } from '../types';

const getUniqueDeviceId = () => {
    let deviceId = localStorage.getItem('snap_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('snap_device_id', deviceId);
    }
    return deviceId;
};

const getDeviceModel = () => {
    const ua = navigator.userAgent;
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    if (ua.includes("Android")) return "Android Phone";
    if (ua.includes("Mac")) return "Mac";
    if (ua.includes("Windows")) return "Windows PC";
    return "Unknown Device";
};

const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], { type: mime });
};

const uploadPhotoToStorage = async (base64Data: string, path: string): Promise<string> => {
    try {
        const blob = base64ToBlob(base64Data);
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        return await getDownloadURL(storageRef);
    } catch (e) {
        console.error("Upload failed", e);
        throw e;
    }
};

export const registerUser = async (user: UserProfile, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Password required");
    const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
    
    // Create a default company for the new user (Owner)
    const companyId = crypto.randomUUID();
    const companySettings: CompanySettings = {
        id: companyId,
        ownerId: userCredential.user.uid,
        name: user.company || 'Minha Empresa',
        website: '',
        primaryColor: '#623aa2',
        backgroundColor: '#ffffff',
        allowUserWatermark: true
    };
    await setDoc(doc(db, "companies", companyId), companySettings);

    const newUser = { 
        ...user, 
        id: userCredential.user.uid, 
        deviceId: getUniqueDeviceId(), 
        createdAt: Date.now(),
        companyId: companyId // Link user to new company
    };
    await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Password required");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (!userDoc.exists()) return { id: uid, email, role: 'Fotografo', firstName: 'User', lastName: '', phone: '', cpf: '', createdAt: Date.now() };
        
        const userData = userDoc.data() as UserProfile;
        
        // Record Device Login
        const deviceId = getUniqueDeviceId();
        const deviceData: Device = {
            id: deviceId,
            userId: uid,
            userName: `${userData.firstName} ${userData.lastName}`,
            name: getDeviceModel(),
            model: navigator.platform,
            type: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            lastAccess: Date.now(),
            status: 'Active'
        };
        // Save to subcollection
        await setDoc(doc(db, `users/${uid}/devices/${deviceId}`), deviceData);

        // Check if blocked logic (DeviceLocker)
        if (userData.deviceId && userData.deviceId !== deviceId) {
            // Logic to check if THIS device is blocked in the devices subcollection could go here
            // For now, we update the main deviceId to current to allow "switching" but tracking history
            await updateDoc(doc(db, "users", uid), { deviceId: deviceId, lastActive: Date.now() });
        }

        return userData;
    } catch (error: any) {
        if (error.code === 'permission-denied') return { id: uid, email, role: 'Fotografo', firstName: 'Offline', lastName: 'Mode', phone: '', cpf: '', createdAt: Date.now() };
        throw error;
    }
};

// --- COMPANY SETTINGS ---

export const getCompanySettings = async (companyId: string): Promise<CompanySettings | null> => {
    try {
        const docSnap = await getDoc(doc(db, "companies", companyId));
        if (docSnap.exists()) return docSnap.data() as CompanySettings;
        return null;
    } catch (e) { console.error(e); return null; }
};

export const saveCompanySettings = async (settings: CompanySettings, logoFile?: File): Promise<CompanySettings> => {
    let logoUrl = settings.logoUrl;
    
    if (logoFile) {
        const storageRef = ref(storage, `companies/${settings.id}/logo.png`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
    }

    const updated = { ...settings, logoUrl };
    await setDoc(doc(db, "companies", settings.id), updated);
    return updated;
};

export const getCompanyUsers = async (companyId: string): Promise<UserProfile[]> => {
    try {
        const q = query(collection(db, "users"), where("companyId", "==", companyId));
        const snap = await getDocs(q);
        const users: UserProfile[] = [];
        snap.forEach(d => users.push(d.data() as UserProfile));
        return users;
    } catch (e) { return []; }
};

export const getCompanyDevices = async (companyId: string): Promise<Device[]> => {
    // In Firestore Lite, collectionGroup queries are limited. 
    // Ideally we query all users of company, then fetch their devices.
    const users = await getCompanyUsers(companyId);
    const allDevices: Device[] = [];
    
    for (const user of users) {
        try {
            const devSnap = await getDocs(collection(db, `users/${user.id}/devices`));
            devSnap.forEach(d => allDevices.push(d.data() as Device));
        } catch (e) {}
    }
    return allDevices;
};

export const toggleDeviceStatus = async (userId: string, deviceId: string, newStatus: 'Active' | 'Blocked') => {
    await updateDoc(doc(db, `users/${userId}/devices/${deviceId}`), { status: newStatus });
};

export const getInvoices = async (companyId: string): Promise<Invoice[]> => {
    try {
        const q = query(collection(db, "invoices"), where("companyId", "==", companyId));
        const snap = await getDocs(q);
        if (snap.empty) {
            // Create mock invoice if empty for demo
            const mock: Invoice = { 
                id: 'inv_1', companyId, number: 'NV2025-001', 
                date: Date.now(), amount: 59.00, status: 'Paid' 
            };
            await setDoc(doc(db, "invoices", 'inv_1'), mock);
            return [mock];
        }
        const invs: Invoice[] = [];
        snap.forEach(d => invs.push(d.data() as Invoice));
        return invs;
    } catch (e) { return []; }
};

// --- EXISTING USER/PROJECT LOGIC ---

export const updateUser = async (user: UserProfile): Promise<UserProfile> => {
    let avatarUrl = user.avatar;
    let watermarkUrl = user.watermarkUrl;

    // Upload Avatar if Base64
    if (user.avatar && user.avatar.startsWith('data:image')) {
        try { avatarUrl = await uploadPhotoToStorage(user.avatar, `avatars/${user.id}_${Date.now()}.jpg`); } catch (e) {}
    }

    // Upload Watermark if Base64
    if (user.watermarkUrl && user.watermarkUrl.startsWith('data:image')) {
        try { 
            const blob = base64ToBlob(user.watermarkUrl);
            const storageRef = ref(storage, `watermarks/${user.id}_wm.png`);
            await uploadBytes(storageRef, blob, { contentType: 'image/png' });
            watermarkUrl = await getDownloadURL(storageRef);
        } catch (e) {
            console.error("Watermark upload failed", e);
        }
    }

    const updatedUser = { ...user, avatar: avatarUrl, watermarkUrl: watermarkUrl };
    try { await updateDoc(doc(db, "users", user.id), updatedUser); } catch (e) {}
    return updatedUser;
};

export const deleteUserAccount = async (email: string, userId: string): Promise<void> => {
    const projects = await getUserProjects(userId);
    for (const p of projects) await deleteProject(p.id);
    await deleteDoc(doc(db, "users", userId));
    if (auth.currentUser) await auth.currentUser.delete();
};

export const logoutUser = async () => { await signOut(auth); localStorage.removeItem('snap_user_session'); };
export const getCurrentUser = () => { const s = localStorage.getItem('snap_user_session'); return s ? JSON.parse(s) : null; };
export const saveUserSession = (u: UserProfile) => localStorage.setItem('snap_user_session', JSON.stringify(u));

export const saveProject = async (project: Project): Promise<Project> => {
    const sanitized = JSON.parse(JSON.stringify(project));
    const photosWithUrls: Photo[] = [];
    
    for (const photo of project.photos) {
        let finalUrl = photo.url;
        let finalOriginalUrl = photo.originalUrl;
        
        // 1. Upload Main Image
        if (photo.url.startsWith('data:image')) {
            finalUrl = await uploadPhotoToStorage(photo.url, `projects/${project.userId}/${project.id}/${photo.id}.jpg`);
        }

        // 2. Upload Original Image (Fixes 1MB Limit)
        if (photo.originalUrl && photo.originalUrl.startsWith('data:image')) {
            if (photo.originalUrl === photo.url && finalUrl.startsWith('http')) {
                finalOriginalUrl = finalUrl;
            } else {
                finalOriginalUrl = await uploadPhotoToStorage(photo.originalUrl, `projects/${project.userId}/${project.id}/${photo.id}_orig.jpg`);
            }
        }
        
        photosWithUrls.push({ ...photo, url: finalUrl, originalUrl: finalOriginalUrl });
    }

    let cover = sanitized.coverImage;
    if (cover && cover.startsWith('data:image')) {
         const match = photosWithUrls.find(p => project.photos.find(old => old.url === cover)?.id === p.id);
         if (match) cover = match.url;
         else cover = await uploadPhotoToStorage(cover, `projects/${project.userId}/${project.id}/cover_${Date.now()}.jpg`);
    }

    const projectToSave = { ...sanitized, photos: photosWithUrls, coverImage: cover || null };
    await setDoc(doc(db, "projects", project.id), projectToSave);
    return projectToSave as Project;
};

export const deleteProject = async (id: string) => { try { await deleteDoc(doc(db, "projects", id)); } catch (e) {} };

export const getUserProjects = async (userId: string): Promise<Project[]> => {
    try {
        const q = query(collection(db, "projects"), where("userId", "==", userId));
        const snap = await getDocs(q);
        const projects: Project[] = [];
        snap.forEach(d => projects.push(d.data() as Project));
        return projects.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e: any) {
        if (e.code === 'permission-denied') return [];
        throw e;
    }
};
