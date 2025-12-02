// -------------------------------------------
// USER PROFILE
// -------------------------------------------

export interface UserPreferences {
  language: string;
  notifications: boolean;
  marketing: boolean;
  theme: string;
}

export interface UserProfile {
  id: string;
  role: string;

  firstName: string;
  lastName: string;
  email: string;

  phone?: string | null;
  cpf?: string | null;
  company?: string | null;

  // Usado só em fluxos de registo / formulário, não no backend
  password?: string;

  // URL do avatar (foto de perfil)
  avatar?: string | null;

  // Última actividade (timestamp em ms)
  lastActive?: number | null;

  createdAt: number;

  preferences: UserPreferences;
}

// -------------------------------------------
// PROJECT DETAILS
// -------------------------------------------
export interface ProjectDetails {
  rooms?: number | null;
  area?: number | null;
  price?: number | null;
  bathrooms?: number | null;
  garage?: number | null;
  description?: string | null;

  address: string;
}

// -------------------------------------------
// CONTACTS (para ProjectContacts)
// -------------------------------------------
export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;       // ex.: "Proprietário", "Cliente", etc.
  notes?: string | null;
}

// -------------------------------------------
// PHOTO
// -------------------------------------------
export interface Photo {
  id: string;
  url: string;             // URL final
  name: string;            // Nome do ficheiro
  type?: string;           // "hdr" ou "standard"
  createdAt: number;       // Timestamp do upload
  timestamp?: number;      // Para ordenação e histórico
  originalUrl?: string;    // Usado no editor se necessário

  // Para encadear fotos no TourViewer
  linkedTo?: string | null;
}

// -------------------------------------------
// PROJECT
// -------------------------------------------
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

  // Lista de contactos associada ao projecto (ProjectContacts)
  contacts?: Contact[]; 
}

// -------------------------------------------
// BILLING / INVOICES (BillingTab)
// -------------------------------------------
export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number?: string;          // nº da factura
  amount: number;           // valor em €
  currency?: string;        // ex.: "EUR"
  status: InvoiceStatus;
  createdAt: number;        // emissão
  dueDate?: number | null;  // vencimento
  description?: string | null;
}

// -------------------------------------------
// DEVICES (DevicesTab)
// -------------------------------------------
export interface Device {
  id: string;
  name: string;            // ex.: "iPhone 15 do João"
  os?: string | null;      // ex.: "iOS", "Android"
  lastActive: number;      // timestamp
  isActive: boolean;
}

// -------------------------------------------
// COMPANY SETTINGS (GeneralTab)
// -------------------------------------------
export interface CompanySettings {
  id: string;
  name: string;
  legalName?: string | null;
  vatNumber?: string | null;   // NIF/NIPC
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

// -------------------------------------------
// ROUTES
// -------------------------------------------
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

// -------------------------------------------
// EDITOR TOOLS
// -------------------------------------------
export enum ToolMode {
  MAGIC_ERASE = "MAGIC_ERASE",
  VIRTUAL_STAGING = "VIRTUAL_STAGING",
}
