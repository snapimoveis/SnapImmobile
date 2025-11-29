export enum AppRoute {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  WELCOME = 'WELCOME',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  TOUR_VIEWER = 'TOUR_VIEWER',
  SETTINGS = 'SETTINGS',
  MENU = 'MENU'
}

export interface Photo {
  id: string;
  url: string; // Base64 or Blob URL
  originalUrl?: string; // Keep original for revert
  thumbnail?: string;
  name: string;
  type: 'hdr' | 'standard';
  timestamp: number;
  description?: string;
  linkedTo?: string; // ID of the next photo for tour
}

export interface ProjectDetails {
    bedrooms?: number;
    bathrooms?: number;
    area?: number; // sqm or sqft
    price?: number;
    type?: 'Apartment' | 'House' | 'Commercial' | 'Land';
}

// --- NOVA INTERFACE CONTACT ---
export interface Contact {
  id: string;
  name: string;
  role: 'Proprietário' | 'Inquilino' | 'Porteiro' | 'Outro';
  phone: string;
  email?: string;
  notes?: string;
}

export interface Project {
  id: string;
  userId: string; // Link project to user
  title: string;
  address: string;
  coverImage?: string;
  status: 'In Progress' | 'Completed';
  photos: Photo[];
  createdAt: number;
  details?: ProjectDetails;
  // --- NOVO CAMPO ---
  contacts?: Contact[];
}

export interface UserPreferences {
  language?: 'pt-PT' | 'pt-BR' | 'en-US';
  notifications?: boolean;
  marketing?: boolean;
  theme?: 'light' | 'dark';
}

export interface UserProfile {
  id: string;
  role: 'Corretor' | 'Proprietario' | 'Fotografo' | 'Imobiliária' | 'Administrador';
  firstName: string;
  lastName: string; // Apelido
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  
  company?: string; 
  companyId?: string; 
  
  businessName?: string;
  businessEmail?: string;
  website?: string;
  businessLogo?: string;
  
  avatar?: string; 
  businessImage?: string; 
  watermarkUrl?: string; 
  
  preferences?: UserPreferences;
  createdAt: number;
  deviceId?: string;
  status?: 'Active' | 'Blocked' | 'Pending';
  lastActive?: number;
  deviceModel?: string; 
}

export interface Device {
  id: string;
  userId: string;
  userName: string;
  name: string; 
  type: 'Mobile' | 'Desktop' | 'Tablet';
  lastAccess: number;
  status: 'Active' | 'Blocked';
  model: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: number;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  downloadUrl?: string;
  companyId: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  primaryColor: string;
  backgroundColor: string;
  allowUserWatermark: boolean;
  watermarkUrl?: string;
  virtualTourDays?: string[]; 
  ownerId: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  message: string;
}

export enum ToolMode {
  NONE = 'NONE',
  MAGIC_ERASE = 'MAGIC_ERASE',
  VIRTUAL_STAGING = 'VIRTUAL_STAGING',
  ENHANCE = 'ENHANCE'
}
