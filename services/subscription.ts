// services/subscription.ts

import { UserProfile, Project, BillingTrialInfo } from "../types";

// -----------------------------------------
// Criar trial default
// -----------------------------------------
export function createDefaultTrial(): BillingTrialInfo {
  return {
    start: Date.now(),
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxProperties: 3,
    maxPhotosPerProperty: 10,
  };
}

// -----------------------------------------
// Verifica se ainda está dentro do trial
// -----------------------------------------
export function isTrialActive(user: UserProfile): boolean {
  if (!user.billing?.trial) return false;
  return Date.now() < user.billing.trial.expires;
}

// -----------------------------------------
// Pode criar imóvel?
// -----------------------------------------
export function canCreateProperty(
  user: UserProfile,
  projects: Project[]
): boolean {
  if (!user.billing?.trial) return true;

  const trial = user.billing.trial;

  if (!trial.maxProperties) return true;

  return projects.length < trial.maxProperties;
}

// -----------------------------------------
// Pode adicionar foto ao imóvel?
// -----------------------------------------
export function canAddPhotoToProperty(
  user: UserProfile,
  project: Project
): boolean {
  if (!user.billing?.trial) return true;

  const trial = user.billing.trial;

  if (!trial.maxPhotosPerProperty) return true;

  const count = project.photos?.length ?? 0;

  return count < trial.maxPhotosPerProperty;
}

// -----------------------------------------
// Atualiza trial (se necessário)
// -----------------------------------------
export function ensureTrialState(user: UserProfile): UserProfile {
  const trial = user.billing?.trial;

  if (trial && Date.now() > trial.expires) {
    // expirou
    return {
      ...user,
      billing: {
        ...user.billing,
        trial: undefined,
        plan: "free",
      },
    };
  }

  return user;
}
