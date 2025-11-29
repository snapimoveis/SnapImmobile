// === PERFIL DO UTILIZADOR ===
export interface UserProfile {
  id: string;
  role: 'admin' | 'editor' | 'viewer';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  company?: string;
  createdAt: number;
  password?: string; // Opcional, usado apenas no registo
  avatar?: string;   // Adicionado para resolver erro no ProfileTab
  lastActive?: number; // Adicionado para resolver erro no UsersTab
  watermarkUrl?: string; // Adicionado para resolver erro no storage.ts
  deviceId?: string; // Adicionado para resolver erro no storage.ts
  preferences: {
    language: string;
    notifications: boolean;
    marketing: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

// === FOTOS E MEDIA ===
export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;        // ex: 'hdr', 'wide', etc.
  createdAt?: number;
  originalUrl?: string; // Adicionado para resolver erro no CameraView
  linkedTo?: string;    // Adicionado para resolver erro no TourViewer (link entre fotos)
}

// === CONTACTOS ===
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  notes?: string;
}

// === PROJETOS ===
export interface ProjectDetails {
  rooms?: number;
  area?: number;
  price?: number;
  description?: string;
  bathrooms?: number;
  year?: number;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  details?: ProjectDetails;
  status: 'In Progress' | 'Completed' | 'Archived';
  photos: Photo[];
  contacts?: Contact[]; // Adicionado para resolver erro no ProjectContacts
  createdAt: number;
  coverImage?: string;
}

// === EDITOR ===
export type ToolMode = 'crop' | 'filter' | 'adjust' | 'text' | 'draw' | 'watermark';

// === CONFIGURAÇÕES E FATURAÇÃO ===
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  url?: string;
  items?: string[];
}

export interface Device {
  id: string;
  userId?: string; // Adicionado para resolver erro no storage.ts
  name: string;
  type: string;
  lastActive: number;
  current?: boolean;
  ip?: string;
}

export interface CompanySettings {
  id?: string; // Adicionado para resolver erro no storage.ts
  name: string;
  logoUrl?: string;
  taxId?: string;
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  
  // Cores e Marca (Adicionado para resolver erros no GeneralTab)
  primaryColor?: string;
  backgroundColor?: string;
  allowUserWatermark?: boolean;
  virtualTourDays?: number;
}

// === ROTAS DA APP ===
export enum AppRoute {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  WELCOME = 'WELCOME',
  DASHBOARD = 'DASHBOARD',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  TOUR_VIEWER = 'TOUR_VIEWER',
  SETTINGS = 'SETTINGS',
  MENU = 'MENU'
}
