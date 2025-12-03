// services/api.ts
// API local baseada em localStorage — compatível com App.tsx

import { Project } from "../types";
import { saveProjects, getProjectsLocal } from "./storage";

// ========================================
// GET PROJECTS
// ========================================
export async function getProjects(userId: string): Promise<Project[]> {
  const list = getProjectsLocal();
  return list.filter((p) => p.userId === userId);
}

// ========================================
// CREATE PROJECT
// compatível com App.tsx:
// createProject(base)
// ========================================
export async function createProject(
  data: Omit<Project, "id" | "createdAt" | "photos">
): Promise<Project> {
  const list = getProjectsLocal();

  const newProject: Project = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    photos: [],
  };

  const updatedList = [...list, newProject];
  saveProjects(updatedList);

  return newProject;
}

// ========================================
// UPDATE PROJECT
// recebe o Project completo e substitui
// ========================================
export async function updateProject(project: Project): Promise<Project> {
  const list = getProjectsLocal();

  const updatedList = list.map((p) =>
    p.id === project.id ? { ...project } : p
  );

  saveProjects(updatedList);
  return project;
}

// ========================================
// DELETE PROJECT
// ========================================
export async function deleteProject(id: string): Promise<void> {
  const list = getProjectsLocal();
  const updatedList = list.filter((p) => p.id !== id);
  saveProjects(updatedList);
}

// ========================================
// UTILITY: usado para debugging
// ========================================
export function addPhotoToProject(): never {
  throw new Error(
    "addPhotoToProject() foi removido — App.tsx usa updateProject() agora."
  );
}

export function updatePhotoInProject(): never {
  throw new Error(
    "updatePhotoInProject() foi removido — App.tsx usa updateProject()."
  );
}
