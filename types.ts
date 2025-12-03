export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; 
  avatar: string | null;
}

export interface Photo {
  id: string;
  url: string;
  name: string;
  type: "hdr" | "edited";
  createdAt: number;
  originalUrl?: string;
  timestamp: number;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  createdAt: number;
  photos: Photo[];
}

export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  DASHBOARD = "DASHBOARD",
  PROJECT_DETAILS = "PROJECT_DETAILS",
  CAMERA = "CAMERA",
}
