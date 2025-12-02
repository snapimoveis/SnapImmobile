// types.ts

export type PlanType = "TRIAL" | "BASIC" | "PRO";

export type SubscriptionStatus =
  | "trial_active"
  | "trial_exhausted"
  | "active"
  | "past_due"
  | "canceled"
  | "none";

export interface TrialInfo {
  startedAt: number;              // timestamp
  maxProperties: number;          // 1
  maxPhotosPerProperty: number;   // 20
  usedProperties: number;         // incrementa ao criar imóvel
  usedPhotos: number;             // incrementa ao tirar foto
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
  role: "Corretor" | "Proprietario" | "Fotografo" | "Imobiliária";
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  cpf?: string;             // mantém por compatibilidade
  company?: string;
  avatar?: string;
  createdAt: number;

  // 💳 NOVO BLOCO
  billing?: BillingInfo;
}
