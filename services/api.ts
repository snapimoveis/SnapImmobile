import { Photo, Project } from "../types";

const PROJECTS_KEY = "snap_projects";

export const api = {
  getProjects(userId: string): Project[] {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    return all.filter((p: Project) => p.userId === userId);
  },

  save(projects: Project[]) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  createProject(userId: string): Project {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");

    const p: Project = {
      id: crypto.randomUUID(),
      userId,
      title: "Novo Imóvel",
      address: "Sem endereço",
      photos: [],
      createdAt: Date.now(),
    };

    all.push(p);
    this.save(all);
    return p;
  },

  deleteProject(id: string) {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    const updated = all.filter((p: Project) => p.id !== id);
    this.save(updated);
  },

  updateProject(id: string, data: Project) {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    const idx = all.findIndex((p: Project) => p.id === id);
    if (idx >= 0) {
      all[idx] = data;
      this.save(all);
    }
  },

  addPhoto(projectId: string, photo: Photo): Project {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    const p = all.find((x: Project) => x.id === projectId);
    if (!p) return null;

    p.photos.push(photo);
    this.save(all);
    return p;
  },

  updatePhoto(projectId: string, photo: Photo) {
    const all = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    const p = all.find((x: Project) => x.id === projectId);
    if (!p) return null;

    const idx = p.photos.findIndex((x: Photo) => x.id === photo.id);
    if (idx >= 0) p.photos[idx] = photo;

    this.save(all);
    return p;
  },
};
