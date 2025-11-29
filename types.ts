export interface UserProfile {
  id: string;
  role: 'admin' | 'editor' | 'viewer'; // Ajuste conforme seus roles reais
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;
  company?: string;
  createdAt: number;
  password?: string; // Opcional, apenas para registro
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
  type?: string; // ex: 'hdr', 'wide', etc.
  createdAt?: number;
}

export interface ProjectDetails {
  rooms?: number;
  area?: number;
  price?: number;
  description?: string;
  // Adicione outros campos específicos do seu projeto aqui
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
}

// Rotas da Aplicação
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
