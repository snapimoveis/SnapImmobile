// ======================================
// services/api.ts — versão compatível
// ======================================

import { Project, Photo } from "../types";
import {
  loadProjects,
  saveProjects,
  createProject as storageCreate,
  deleteProject as storageDelete,
  updateProject as storageUpdate,
} from "./storage";

// ---------------------------------------------------------
// getProjects
// ---------------------------------------------------------
export async function getProjects(userId: string): Promise<Project[]> {
  const all = loadProjects();

  return all.filter((p) => p.userId === userId);
}

// ---------------------------------------------------------
// createProject
// ---------------------------------------------------------
export async function createProject(userId: string): Promise<Project> {
  let project = storageCreate(userId);
  return project;
}

// ---------------------------------------------------------
// deleteProject
// ---------------------------------------------------------
export async function deleteProject(id: string): Promise<void> {
  storageDelete(id);
}

// ---------------------------------------------------------
// updateProject
// ---------------------------------------------------------
export async function updateProject(project: Project): Promise<Project> {
  return storageUpdate(project);
}
