// ==========================================================
// USER
// ==========================================================

export interface UserPreferences {
  language: string;
  notifications: boolean;
  marketing: boolean;
  theme: string;
}

export interface UserProfile {
  id: string;

  role: string; // Corretor, Proprietario, Fotografo, etc.

  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  company?: string | null;

  // Para o ProfileTab
  avatar?: string | null;

  // Sessão, estatísticas etc.
  lastActive?: number | null;

  createdAt: number;

  preferences: UserPreferences;
}



// ==========================================================
// PROJECT DETAILS
// ==========================================================

export interface ProjectDetails {
  rooms?: number | null;
  area?: number | null;
  price?: number | null;
  bathrooms?: number | null;
  garage?: number | null;
  description?: string | null;

  // Obrigatório
  address: string;
}



// ==========================================================
// PHOTO
// ==========================================================

export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string; // hdr | standard
  createdAt: number;
  timestamp?: number;

  // Usado pelo editor
  originalUrl?: string;

  // Usado pelo Tour Viewer (opcional)
  linkedTo?: string | null;
}



// ==========================================================
// CONTACT (ProjectContacts)
// ==========================================================

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role: string; // Proprietário, Inquilino, Porteiro, Outro
  email?: string;
  notes?: string;
}



// ==========================================================
// PROJECT
// ==========================================================

export interface Project {
  id: string;
  userId: string;

  title: string;
  address: string;

  status: "In Progress" | "Completed";

  createdAt: number;

  details: ProjectDetails;

  photos: Photo[];
  coverImage?: string | null;

  // Para ProjectContacts
  contacts?: Contact[];
}



// ==========================================================
// APP ROUTES
// ==========================================================

export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  WELCOME = "WELCOME",
  REGISTER = "REGISTER",
  DASHBOARD = "DASHBOARD",
  PROJECT_DETAILS = "PROJECT_DETAILS",
  CAMERA = "CAMERA",
  EDITOR = "EDITOR",
  MENU = "MENU",
  SETTINGS = "SETTINGS",
  TOUR_VIEWER = "TOUR_VIEWER",
}



// ==========================================================
// EDITOR TOOL MODES
// ==========================================================

export enum ToolMode {
  MAGIC_ERASE = "MAGIC_ERASE",
  VIRTUAL_STAGING = "VIRTUAL_STAGING",
}



// ==========================================================
// INVOICES (BillingTab)
// ==========================================================

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number?: string;

  amount: number;
  currency?: string;

  status: InvoiceStatus;

  createdAt: number;          // data da emissão
  dueDate?: number | null;

  description?: string | null;
}



// ==========================================================
// DEVICES (DevicesTab)
// ==========================================================

export interface Device {
  id: string;

  type: "mobile" | "desktop" | "tablet" | string;

  name: string;
  model?: string | null;

  userName?: string | null;

  lastAccess?: number | null;
  lastActive?: number | null;

  status: "active" | "inactive" | "Blocked" | "Active" | string;
}



// ==========================================================
// COMPANY SETTINGS (GeneralTab)
// ==========================================================

export interface CompanySettings {
  id: string;

  name: string; // nome da empresa

  website?: string | null;

  // logotipo
  logoUrl?: string | null;

  // watermark
  watermarkUrl?: string | null;

  // cores
  primaryColor?: string | null;
  backgroundColor?: string | null;

  // permitir marca de água do utilizador
  allowUserWatermark?: boolean;

  // visitas virtuais
  virtualTourDays?: string[]; // ["SEG", "TER", ...]

  updatedAt?: number | null;
}
