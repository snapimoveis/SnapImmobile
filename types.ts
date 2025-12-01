// =====================================================
// USER PROFILE — totalmente compatível com Firebase
// =====================================================
export interface UserProfile {
  id: string;
  role: 'admin' | 'editor' | 'viewer' | 'Administrador' | 'Fotografo';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  company?: string;
  createdAt: number;
  
  // Campos opcionais permitidos pelo Firestore
  avatar?: string;
  lastActive?: number;
  watermarkUrl?: string;
  deviceId?: string;

  preferences: {
    language: string;
    notifications: boolean;
    marketing: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}



// =====================================================
// PHOTO — compatível com CameraView e storage.ts
// =====================================================
export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;         // 'hdr', 'original', etc.
  createdAt?: number;    
  timestamp?: number;     // necessário para ordenação
  originalUrl?: string;   // só usada antes do upload
}



// =====================================================
// CONTACT
// =====================================================
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  notes?: string;
}



// =====================================================
// PROJECT DETAILS — usado no formulário de criação
// =====================================================
export interface ProjectDetails {
  rooms?: number;
  area?: number;
  price?: number;
  description?: string;
  bathrooms?: number;
  year?: number;
}



// =====================================================
// PROJECT — compatível 100% com a versão final do storage.ts
// =====================================================
export interface Project {
  id: string;
  userId: string;

  title: string;
  address: string;

  details?: ProjectDetails;

  status: 'In Progress' | 'Completed' | 'Archived';

  photos: Photo[];      // array sempre existente

  contacts?: Contact[];

  createdAt: number;

  // Firestore nunca permite undefined → deixar opcional porém presente
  coverImage?: string | null;
}



// =====================================================
// EDITOR (no modelo original)
// =====================================================
export enum ToolMode {
  CROP = 'crop',
  FILTER = 'fi
