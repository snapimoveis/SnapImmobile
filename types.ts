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

  // ⚠ Campo usado apenas no registo (não salvo no Firestore)
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

  // Garantia que não explode erros:
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

  // Fotos processadas + capa podem ser null
  photos: Photo[];
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
