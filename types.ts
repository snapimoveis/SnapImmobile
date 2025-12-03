// =============================
// ROTAS DA APP
// =============================
export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  WELCOME = "WELCOME",
  DASHBOARD = "DASHBOARD",

  // Nome usado por vários componentes (Shell, ProjectDetail, etc.)
  PROJECT_DETAILS = "PROJECT_DETAILS",

  // Alias para compatibilidade, caso algum código use DETAILS
  DETAILS = "PROJECT_DETAILS",

  CAMERA = "CAMERA",
  EDITOR = "EDITOR",
  TOUR_VIEWER = "TOUR_VIEWER",
  SETTINGS = "SETTINGS",
  MENU = "MENU",
}

// =============================
// FOTOS / TOUR
// =============================
export interface Photo {
  id: string;
  url: string;
  name: string;
  createdAt: number;
  timestamp: number;
  type: "hdr" | "normal";

  originalUrl?: string;

  // Usado no TourViewer (ligar uma foto à seguinte / anterior)
  linkedTo?: string; // id de outra photo
}

// =============================
// CONTACTOS DO IMÓVEL
// =============================
export interface Contact {
  id: string;
  name: string;
  role?: string;   // ex: "Proprietário", "Corretor"
  email?: string;
  phone?: string;
}

// =============================
// DETALHES DO IMÓVEL
// (Project.details)
// =============================
export interface ProjectDetails {
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  price?: number | null;
  type?: string | null;
  address?: string | null;

  // Qualquer outro campo extra
  [key: string]: any;
}

// =============================
// PROJECT / IMÓVEL
// =============================
export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  createdAt: number;

  // Tinha erro de "possibly undefined" → fazemos SEMPRE array
  photos: Photo[];

  // Status simples (rascunho, publicado, etc.)
  status?: string;

  // Card de lista / capa
  coverImage?: string | null;

  // Detalhes estruturados (quartos, área, etc.)
  details?: ProjectDetails;

  // Contactos associados ao imóvel
  contacts?: Contact[];
}

// =============================
// ASSINATURA / BILLING
// =============================
export type PlanType = "TRIAL" | "BASIC" | "PRO";

export type SubscriptionStatus =
  | "trial_active"
  | "trial_exhausted"
  | "active"
  | "past_due"
  | "canceled"
  | "none";

export interface TrialInfo {
  startedAt: number;
  maxProperties: number;
  maxPhotosPerProperty: number;
  usedProperties: number;
  usedPhotos: number;
}

export interface BillingInfo {
  cpf: string;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  trial?: TrialInfo;
}

// =============================
// USER
// =============================
export interface UserPreferences {
  language?: string;              // "pt-PT", "pt-BR", etc.
  notifications?: boolean;
  marketing?: boolean;
  theme?: "light" | "dark" | "system" | string;
}

export interface UserProfile {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  avatar?: string;
  company?: string;
  createdAt: number;

  // Usado em UsersTab
  lastActive?: number;

  // Usado em storage.ts e outras telas
  preferences?: UserPreferences;

  // Assinatura / trial
  billing?: BillingInfo;
}

// =============================
// SETTINGS – COMPANY / DEVICES
// =============================

// Usado em settings/DevicesTab.tsx
export interface Device {
  id: string;
  name: string;
  model?: string;
  platform?: string;       // "iOS", "Android", "Web", etc.
  lastActive?: number;
  isCurrent?: boolean;
  location?: string;
}

// Usado em settings/GeneralTab.tsx
export interface CompanySettings {
  companyName: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  locale?: string;
  timezone?: string;
  [key: string]: any;
}

// =============================
// BILLING / FACTURAS (Asaas)
// =============================

// Usado em settings/BillingTab.tsx
export type InvoiceStatus = "pending" | "paid" | "canceled" | "overdue";

export interface Invoice {
  id: string;
  amount: number;     // em centavos ou euros, depende da implementação
  status: InvoiceStatus;
  createdAt: number;
  dueDate?: number;
  description?: string;
  planName?: string;
  [key: string]: any;
}

// =============================
// EDITOR AI
// =============================
export enum ToolMode {
  MAGIC_ERASE = "MAGIC_ERASE",
  VIRTUAL_STAGING = "VIRTUAL_STAGING",
}
