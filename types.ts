export enum AppRoute {
  LANDING = "LANDING",
  LOGIN = "LOGIN",
  REGISTER = "REGISTER",
  DASHBOARD = "DASHBOARD",
  DETAILS = "DETAILS",
  CAMERA = "CAMERA",
  EDITOR = "EDITOR",
  SETTINGS = "SETTINGS",
}

export interface Photo {
  id: string;
  url: string;
  name: string;
  createdAt: number;
  timestamp: number;
  type: "hdr" | "normal";
  originalUrl?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  address: string;
  createdAt: number;
  photos?: Photo[];
}

// ----------------------
// ASSINATURA + TRIAL
// ----------------------
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
  billing?: BillingInfo;
}
