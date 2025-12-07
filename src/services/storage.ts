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
  } catch (error) {
    console.error("Erro ao ler projects do localStorage:", error);
    return [];
  }
}

// ---------------------------------------------
// Guardar imóveis no localStorage
// ---------------------------------------------
export function saveProjects(list: Project[]) {
  try {
    localStorage.setItem("projects", JSON.stringify(list));
  } catch (error) {
    console.error("Erro ao gravar projects no localStorage:", error);
  }
}

