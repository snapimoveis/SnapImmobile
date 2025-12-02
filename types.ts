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
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  company?: string | null;
  avatar?: string | null;
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
  address: string;
}

// ==========================================================
// CONTACT
// ==========================================================

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role: string;
  email?: string;
  notes?: string;
}

// ==========================================================
// PHOTO
// ==========================================================

export interface Photo {
  id: string;
  url: string;
  name: string;
  type?: string;
  createdAt: number;
  timestamp?: number;
  originalUrl?: string;
  linkedTo?: string | null;
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
  contacts?: Contact[];
}

// ==========================================================
// ROUTES
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
// EDITOR TOOLS
// ==========================================================

export enum ToolMode {
  MAGIC_ERASE = "MAGIC_ERASE",
  VIRTUAL_STAGING = "VIRTUAL_STAGING",
}

// ==========================================================
// INVOICES
// ==========================================================

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  number?: string;
  amount: number;
  currency?: string;
  status: InvoiceStatus;
  createdAt: number;
  dueDate?: number | null;
  description?: string | null;
}

// ==========================================================
// DEVICES
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
// COMPANY SETTINGS
// ==========================================================

export interface CompanySettings {
  id: string;
  name: string;
  website?: string | null;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
  primaryColor?: string | null;
  backgroundColor?: string | null;
  allowUserWatermark?: boolean;
  virtualTourDays?: string[];
  updatedAt?: number | null;
}
