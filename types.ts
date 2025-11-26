export enum AppRoute {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  WELCOME = 'WELCOME',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  TOUR_VIEWER = 'TUR_VIEWER',
  SETTINGS = 'SETTINGS',
  MENU = 'MENU'
}

export interface Photo {
  id: string;
  url: string;
  originalUrl?: string;
  thumbnail?: string;
  name: string;
  type: 'hdr' | 'standard';
  timestamp: number;
  description?: string;
  linkedTo?: string;

  // ⭐ OBRIGATÓRIO
  mode: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window';
}

export interface ProjectDetails {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    price?: number;
    type?: 'Apartment' | 'House' | 'Commercial' | 'Land';
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  coverImage?: string;
  status: 'In Progress' | 'Completed';

  photos: Photo[];

  createdAt: number;
  details?: ProjectDetails;
}

export interface UserPreferences {
  language: 'pt-PT' | 'pt-BR' | 'en-US';
  notifications: boolean;
  marketing: boolean;
  theme: 'light' | 'dark';
}

export interface UserProfile {
  id: string;
  role: 'Corretor' | 'Proprietario' | 'Fotografo' | 'Imobiliária';
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  cpf: string;
  company?: string;
  avatar?: string;
  preferences?: UserPreferences;
  createdAt: number;
  deviceId?: string;
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
