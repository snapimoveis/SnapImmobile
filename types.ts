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
  password?: string;
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

// === FOTOS E MEDIA ===
export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;
  createdAt?: number;
  originalUrl?: string;
  linkedTo?: string;
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
  contacts?: Contact[];
  createdAt: number;
  coverImage?: string;
}

// === EDITOR ===
// FIX: Alterado de 'type' para 'enum' para permitir usar como valor (ToolMode.CROP)
export enum ToolMode {
  CROP = 'crop',
  FILTER = 'filter',
  ADJUST = 'adjust',
  TEXT = 'text',
  DRAW = 'draw',
  WATERMARK = 'watermark'
}

// === CONFIGURAÇÕES E FATURAÇÃO ===
export interface Invoice {
  id: string;
  number: string; // FIX: Adicionado número
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  url?: string;
  items?: string[];
}

export interface Device {
  id: string;
  userId?: string;
  name: string;
  type: string;
  model?: string; // FIX: Adicionado modelo
  userName?: string; // FIX: Adicionado nome do utilizador
  lastAccess?: number; // FIX: Alias para lastActive
  lastActive: number;
  current?: boolean;
  ip?: string;
  status?: 'active' | 'inactive'; // FIX: Adicionado status
}

export interface CompanySettings {
  id?: string;
  name: string;
  logoUrl?: string;
  taxId?: string;
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  primaryColor?: string;
  backgroundColor?: string;
  allowUserWatermark?: boolean;
  virtualTourDays?: number;
  // FIX: Permite aceder a propriedades dinamicamente (como 'includes')
  [key: string]: any; 
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
