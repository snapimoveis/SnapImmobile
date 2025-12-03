// ======================================================================
// services/subscription.ts — Sistema de Trial + Limites
// ======================================================================

import { BillingInfo, BillingTrialInfo, Project, UserProfile } from "../types";
import { saveUsers, loadUsers } from "./storage";

// ----------------------------------------------------------------------
// PARÂMETROS DO TRIAL
// ----------------------------------------------------------------------
const TRIAL_DAYS = 7;
const TRIAL_MAX_PROPERTIES = 1;
const TRIAL_MAX_PHOTOS = 20;

// ----------------------------------------------------------------------
// CRIA TRIAL DO ZERO
// ----------------------------------------------------------------------
export function createTrial(): BillingTrialInfo {
  const start = Date.now();
  const expires = start + TRIAL_DAYS * 24 * 60 * 60 * 1000;

  return {
    start,
    expires,
    maxProperties: TRIAL_MAX_PROPERTIES,
    maxPhotosPerProperty: TRIAL_MAX_PHOTOS,
  };
}

// ----------------------------------------------------------------------
// GARANTE QUE O USER TEM BILLING E TRIAL
// (Chamado no login em App.tsx)
// ----------------------------------------------------------------------
export function ensureTrialState(user: UserProfile): UserProfile {
  if (!user.billing) {
    user.billing = {
      plan: "TRIAL",
      trial: createTrial(),
    };
    persistUser(user);
    return user;
  }

  // se existe billing mas não tem trial
  if (user.billing.plan === "TRIAL" && !user.billing.trial) {
    user.billing.trial = createTrial();
    persistUser(user);
  }

  return user;
}

// ----------------------------------------------------------------------
// VERIFICAR SE O TRIAL AINDA É VÁLIDO
// ----------------------------------------------------------------------
export function isTrialActive(user: UserProfile): boolean {
  if (user.billing?.plan !== "TRIAL") return false;
  if (!user.billing.trial) return false;

  return Date.now() < user.billing.trial.expires;
}

// ----------------------------------------------------------------------
// LIMITE DE IMÓVEIS (properties)
// ----------------------------------------------------------------------
export function canCreateNewProperty(
  user: UserProfile,
  projects: Project[]
): boolean {
  // Se pagamento no futuro → permitir tudo
  if (user.billing?.plan !== "TRIAL") return true;

  const trial = user.billing.trial;
  if (!trial) return false;

  const limit = trial.maxProperties ?? TRIAL_MAX_PROPERTIES;
  return projects.length < limit;
}

// ----------------------------------------------------------------------
// LIMITE DE FOTOS POR PROJETO
// ----------------------------------------------------------------------
export function canAddPhotoToProject(
  user: UserProfile,
  project: Project
): boolean {
  if (user.billing?.plan !== "TRIAL") return true;

  const trial = user.billing.trial;
  if (!trial) return false;

  const limit = trial.maxPhotosPerProperty ?? TRIAL_MAX_PHOTOS;
  const count = project.photos.length;

  return count < limit;
}

// ----------------------------------------------------------------------
// SALVAR O USER APÓS ALTERAÇÃO DE BILLING/TRIAL
// ----------------------------------------------------------------------
function persistUser(user: UserProfile) {
  const all = loadUsers();
  const idx = all.findIndex((u) => u.id === user.id);

  if (idx !== -1) {
    all[idx] = user;
    saveUsers(all);
  }
}
