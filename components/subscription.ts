// services/subscription.ts
import { UserProfile, Project } from "../types";

export const DEFAULT_TRIAL: { maxProperties: number; maxPhotosPerProperty: number } = {
  maxProperties: 1,
  maxPhotosPerProperty: 20,
};

export function ensureTrialInfo(user: UserProfile): UserProfile {
  if (!user.billing) {
    user.billing = {
      cpf: user.cpf || "",
      plan: "TRIAL",
      status: "trial_active",
      trial: {
        startedAt: Date.now(),
        maxProperties: DEFAULT_TRIAL.maxProperties,
        maxPhotosPerProperty: DEFAULT_TRIAL.maxPhotosPerProperty,
        usedProperties: 0,
        usedPhotos: 0,
      },
    };
    return user;
  }

  if (!user.billing.trial && user.billing.plan === "TRIAL") {
    user.billing.trial = {
      startedAt: Date.now(),
      maxProperties: DEFAULT_TRIAL.maxProperties,
      maxPhotosPerProperty: DEFAULT_TRIAL.maxPhotosPerProperty,
      usedProperties: 0,
      usedPhotos: 0,
    };
  }

  return user;
}

export function canCreateNewProperty(user: UserProfile, projects: Project[]): boolean {
  if (!user.billing || user.billing.plan !== "TRIAL") return true; // planos pagos sem limite

  const trial = user.billing.trial;
  if (!trial) return true;

  if (trial.usedProperties >= trial.maxProperties) return false;

  // segurança extra: garantir pelos próprios projetos
  const userProjectsCount = projects.length;
  if (userProjectsCount >= trial.maxProperties) return false;

  return true;
}

export function canAddPhotoToProject(user: UserProfile, project: Project): boolean {
  if (!user.billing || user.billing.plan !== "TRIAL") return true;

  const trial = user.billing.trial;
  if (!trial) return true;

  const photoCount = project.photos?.length || 0;
  if (photoCount >= trial.maxPhotosPerProperty) return false;

  return true;
}
