// ======================================================
// services/storage.ts — STORAGE LOCAL COM TIPOS CORRETOS
// ======================================================

import { Project, Photo, Contact, UserProfile } from "../types";

// ------------------------------------------------------
// KEYS
// ------------------------------------------------------
const PROJECTS_KEY = "snap_projects";
const USERS_KEY = "snap_users";

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ======================================================
// USERS
// ======================================================

export function loadUsers(): UserProfile[] {
  return load<UserProfile[]>(USERS_KEY, []);
}

export function saveUsers(list: UserProfile[]) {
  save(USERS_KEY, list);
}

// ======================================================
// PROJECTS
// ======================================================

// Carregar todos
export function loadProjects(): Project[] {
  return load<Project[]>(PROJECTS_KEY, []);
}

// Salvar todos
export function saveProjects(list: Project[]) {
  save(PROJECTS_KEY, list);
}

// Criar projeto
export function createProject(userId: string): Project {
  const list = loadProjects();

  const newProject: Project = {
    id: crypto.randomUUID(),
    title: "Novo Imóvel",
    address: "",
    createdAt: Date.now(),
    userId,
    status: "draft",
    details: {},
    photos: [],
    contacts: [],
    coverImage: undefined
  };

  list.push(newProject);
  saveProjects(list);
  return newProject;
}

// Apagar
export function deleteProject(id: string) {
  const list = loadProjects().filter((p) => p.id !== id);
  saveProjects(list);
}

// Atualizar projeto
export function updateProject(project: Project): Project {
  const list = loadProjects();
  const index = list.findIndex((p) => p.id === project.id);

  if (index >= 0) {
    list[index] = { ...project };
    saveProjects(list);
    return list[index];
  }

  // Caso contrário adicionamos
  list.push(project);
  saveProjects(list);
  return project;
}

// ======================================================
// PHOTOS
// ======================================================

export function addPhotoToProject(projectId: string, base64: string, title: string): Photo {
  const list = loadProjects();
  const project = list.find((p) => p.id === projectId);

  if (!project) throw new Error("Project not found");

  const newPhoto: Photo = {
    id: crypto.randomUUID(),
    url: base64,
    originalUrl: base64,
    name: title,
    type: "hdr",
    timestamp: Date.now(),
    createdAt: Date.now(),
    linkedTo: undefined
  };

  project.photos.push(newPhoto);

  // coverImage — garantir tipo correto
  project.coverImage = project.photos.length > 0 ? project.photos[0].url : undefined;

  saveProjects(list);
  return newPhoto;
}

// Substituir / editar foto
export function updatePhotoInProject(projectId: string, photo: Photo): Photo {
  const list = loadProjects();
  const project = list.find((p) => p.id === projectId);

  if (!project) throw new Error("Project not found");

  const index = project.photos.findIndex((p) => p.id === photo.id);
  if (index < 0) throw new Error("Photo not found");

  project.photos[index] = { ...photo };

  // atualizar coverImage
  project.coverImage = project.photos.length > 0 ? project.photos[0].url : undefined;

  saveProjects(list);
  return photo;
}

// ======================================================
// CONTACTS
// ======================================================

export function addContactToProject(projectId: string, contact: Contact): Contact {
  const list = loadProjects();
  const project = list.find((p) => p.id === projectId);

  if (!project) throw new Error("Project not found");

  const newContact: Contact = {
    ...contact,
    id: crypto.randomUUID(),
  };

  project.contacts = [...(project.contacts || []), newContact];

  saveProjects(list);
  return newContact;
}
