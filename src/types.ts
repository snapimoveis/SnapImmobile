// ===============================
// USER & AUTH
// ===============================

export type UserRole = "admin" | "editor" | "viewer" | "owner" | "client";

export interface BillingTrialInfo {
  start: number;
  expires: number;

  // usados em subscription.ts
  maxProperties?: number;
  maxPhotosPerProperty?: number;

  // usados no código
  startedAt?: number;
}

export interface BillingInfo {
  plan?: "free" | "pro" | "team" | "TRIAL";
  trial?: BillingTrialInfo;
  nextInvoice?: number;
  customerId?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  avatar?: string | null;
  role?: UserRole;
  phone?: string;
  cpf?: string;
  lastActive?: number;

  // alguns ficheiros usam createdAt
  createdAt?: number;

  billing?: BillingInfo;
}

// ===============================
// PROJECTS
// ===============================

export interface Photo {
  id: string;
  url: string;
  originalUrl?: string;
  name: string;
  type: "hdr" | "simple";
  timestamp: number;

  // usado em storage.ts
  createdAt?: number;

  // usado em TourViewer
  linkedTo?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
}

export interface ProjectDetails {
  rooms?: number;
  bathrooms?: number;
  size?: number;
  description?: string;

  // usado em NewProjectModal
  area?: number;
}

export interface Project {
  id: string;

  // muitos componentes usam project.title
  title: string;

  address?: string;
  createdAt: number;
  userId?: string;

  status?: string;
  details?: ProjectDetails;

  // usado em ProjectCard / ProjectList
  coverImage?: string;

  photos: Photo[];
  contacts?: Contact[];
}

// ===============================
// COMPANY SETTINGS
// ===============================

export interface CompanySettings {
  name?: string;
  logoUrl?: string;
  website?: string;
  primaryColor?: string;
  backgroundColor?: string;
  allowUserWatermark?: boolean;
  virtualTourDays?: string[];
}

// ===============================
// DEVICES
// ===============================

export interface Device {
  id: string;

  name?: string;
  model?: string; // usado em DevicesTab

  type?: string;
  status?: "active" | "inactive" | "blocked";

  lastAccess?: number;
  lastActive?: number;
  userName?: string;
}

// ===============================
// BILLING (FATURAÇÃO)
// ===============================

export type InvoiceStatus = "pending" | "paid" | "overdue";

export interface Invoice {
  id: string;
  number?: string;

  // usado em BillingTab
  amount: number;

  createdAt?: number;

  status: InvoiceStatus;
}

// ===============================
// EDITOR
// ===============================

export enum ToolMode {
  MAGIC_ERASE = "MAGIC_ERASE",
  VIRTUAL_STAGING = "VIRTUAL_STAGING",
}

// ===============================
// ROUTES
// ===============================

export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  DASHBOARD = "DASHBOARD",
  PROJECT_DETAILS = "PROJECT_DETAILS",
  CAMERA = "CAMERA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
  MENU = "MENU",
}
