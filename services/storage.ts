// services/storage.ts
import { Project } from "../types";

// ---------------------------------------------
// Carregar lista de imóveis do localStorage
// ---------------------------------------------
export function getProjectsLocal(): Project[] {
  try {
    const raw = localStorage.getItem("projects");
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

// ---------------------------------------------
// Guardar imóveis
// ---------------------------------------------
export function saveProjects(list: Project[]) {
  localStorage.setItem("projects", JSON.stringify(list));
}
