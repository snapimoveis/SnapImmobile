// === PERFIL DO UTILIZADOR ===
export interface UserPreferences {
  language: string;
  notifications: boolean;
  marketing: boolean;
  theme: "light" | "dark" | "system";
}

export interface UserProfile {
  id: string;
  role: "admin" | "editor" | "viewer" | "Administrador" | "Fotografo";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  company?: string | null;
  createdAt: number;
  avatar?: string | null;
  lastActive?: number | null;
  watermarkUrl?: string | null;
  deviceId?: string | null;

  // preferences nunca pode ser undefined no app
  preferences: UserPreferences;
}

// === FOTOS E MEDIA ===
export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;
  createdAt: number;
  originalUrl: string;
  linkedTo?: string | null;
  timestamp: number;
}

// === CONTACTOS ===
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  notes?: string | null;
}

// === PROJETOS ===
export interface ProjectDetails {
  rooms?: number | null;
  area?: number | null;
  price?: number | null;
  description?: string | null;
  bathrooms?: number | null;
  year?: number | null;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  details?: ProjectDetails;
  status: "In Progress" | "Completed" | "Archived";
  photos: Photo[];
  contacts?: Contact[];
  createdAt: number;

  // sempre ter algo: string válida
  coverImage: string;
}

// === EDITOR ===
export enum ToolMode {
  CROP = "crop",
  FILTER = "filter",
  ADJUST = "adjust",
  TEXT = "text",
  DRAW = "draw",
  WATERMARK = "watermark",
  MAGIC_ERASE = "magic_erase",
  VIRTUAL_STAGING = "virtual_staging",
}

// === CONFIGURAÇÕES ===
export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  url?: string | null;
  items?: string[] | null;
}

export interface Device {
  id: string;
  userId?: string;
  name: string;
  type: string;
  model?: string | null;
  userName?: string | null;
  lastAccess?: number | null;
  lastActive: number;
  current?: boolean;
  ip?: string | null;
  status?: "active" | "inactive" | "Active" | "Blocked";
}

export interface CompanySettings {
  id?: string;
  name: string;
  logoUrl?: string | null;
  taxId?: string | null;
  address?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  allowUserWatermark?: boolean;
  virtualTourDays?: string[];
  [key: string]: any;
}

// === ROTAS ===
export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  WELCOME = "WELCOME",
  DASHBOARD = "DASHBOARD",
  PROJECT_DETAILS = "PROJECT_DETAILS",
  CAMERA = "CAMERA",
  EDITOR = "EDITOR",
  TOUR_VIEWER = "TOUR_VIEWER",
  SETTINGS = "SETTINGS",
  MENU = "MENU",
}
