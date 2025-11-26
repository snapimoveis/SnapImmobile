// ---------------------------
// ROUTAS DO APLICATIVO
// ---------------------------
export enum AppRoute {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  WELCOME = 'WELCOME',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  PROJECT_DETAILS = 'PROJECT_DETAILS',
  TOUR_VIEWER = 'TOUR_VIEWER',
  SETTINGS = 'SETTINGS',
  MENU = 'MENU'
}

// ---------------------------
// FOTO (OBJETO CENTRAL DO SNAP)
// ---------------------------
export interface Photo {
  id: string;

  // Base64 ou URL remota (Firebase)
  url: string;

  // Guarda o original antes de IA
  originalUrl?: string;

  // Miniatura (opcional)
  thumbnail?: string;

  // Nome da foto
  name: string;

  // HDR = 90% das fotos, Standard = fallback
  type: 'hdr' | 'standard';

  // Timestamp
  timestamp: number;

  // Texto opcional
  description?: string;

  // Para tour virtual (foto seguinte)
  linkedTo?: string;

  // ⭐⭐⭐ OBRIGATÓRIO PARA O NOVO HP-HDR
  // Usado pelo CameraView, ProjectDetail e GeminiService
  mode: 'hp_hdr_interior' | 'hp_hdr_exterior' | 'hp_hdr_window';
}

// ---------------------------
// DETALHES DO PROJETO
// ---------------------------
export interface ProjectDetails {
    bedrooms?: number;
    bathrooms?: number;
    area?: number; 
    price?: number;
    type?: 'Apartment' | 'House' | 'Commercial' | 'Land';
}

// ---------------------------
// PROJETO COMPLETO
// ---------------------------
export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  coverImage?: string;
  status: 'In Progress' | 'Completed';

  // ⭐ Lista de fotos com o campo mode incluído
  photos: Photo[];

  createdAt: number;
  details?: ProjectDetails;
}

// ---------------------------
// PERFIS E PREFERÊNCIAS DO UTILIZADOR
// ---------------------------
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

  // Para bloquear login em outro dispositivo
  deviceId?: string;
}

// ---------------------------
// ESTADO DE PROCESSAMENTO GLOBAL
// ---------------------------
export interface ProcessingState {
  isProcessing: boolean;
  message: string;
}

// ---------------------------
// MODOS DE FERRAMENTAS DO EDITOR
// ---------------------------
export enum ToolMode {
  NONE = 'NONE',
  MAGIC_ERASE = 'MAGIC_ERASE',
  VIRTUAL_STAGING = 'VIRTUAL_STAGING',
  ENHANCE = 'ENHANCE'
}
