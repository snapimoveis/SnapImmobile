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

  // ⚠ Usado apenas no processo de registo, não salvo no Firestore.
  // Mantido como opcional para evitar erros de tipo.
  password?: string;

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

  // Necessário pois o App.tsx fornece SEMPRE address
  address: string;
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

  // ⚠ Necessário para o TourViewer — corrige o erro
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

  // Pode ser null ou string
  coverImage?: string | null;
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
