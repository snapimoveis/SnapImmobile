import { UserProfile, Project } from "../types";

export const DEFAULT_TRIAL = {
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
  }
  return user;
}

export function canCreateNewProperty(user: UserProfile, projects: Project[]) {
  if (user.billing?.plan !== "TRIAL") return true;

  const trial = user.billing?.trial;
  if (!trial) return true;

  return projects.length < trial.maxProperties;
}

export function canAddPhotoToProject(user: UserProfile, project: Project) {
  if (user.billing?.plan !== "TRIAL") return true;

  const trial = user.billing.trial;
  if (!trial) return true;

  const count = project.photos?.length || 0;
  return count < trial.maxPhotosPerProperty;
}
