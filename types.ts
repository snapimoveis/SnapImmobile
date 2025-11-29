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
  avatar?: string; // Added avatar
  preferences: {
    language: string;
    notifications: boolean;
    marketing: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;
  createdAt?: number;
  originalUrl?: string; // Added originalUrl
  linkedTo?: string;    // Added linkedTo (for tours)
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface ProjectDetails {
  rooms?: number;
  area?: number;
  price?: number;
  description?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  details?: ProjectDetails;
  status: 'In Progress' | 'Completed' | 'Archived';
  photos: Photo[];
  createdAt: number;
  coverImage?: string;
  contacts?: Contact[]; // Added contacts array
}

// Editor Tools
export type ToolMode = 'crop' | 'filter' | 'adjust' | 'text' | 'draw' | 'watermark';

// Billing Types
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  url?: string;
}

// Device Management
export interface Device {
  id: string;
  name: string;
  lastActive: number;
  current?: boolean;
}

// Company Settings
export interface CompanySettings {
  name: string;
  logoUrl?: string;
  taxId?: string;
  address?: string;
  website?: string;
}

// App Routes
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
