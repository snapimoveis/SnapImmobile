// services/api.ts
// API de projetos 100% em Firebase Firestore (sem localStorage)

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db, auth } from "./firebaseConfig";
import { Project, Photo } from "../types";

/**
 * Referência para a coleção de projetos de um utilizador
 */
function projectsCollection(userId: string) {
  return collection(db, "users", userId, "projects");
}

/**
 * Referência para um projeto específico
 */
function projectDoc(userId: string, projectId: string) {
  return doc(db, "users", userId, "projects", projectId);
}

/**
 * Referência para a subcoleção de fotos de um projeto
 */
function photosCollection(userId: string, projectId: string) {
  return collection(db, "users", userId, "projects", projectId, "photos");
}

/**
 * Converte dados Firestore em Project (inclui fotos carregadas à parte)
 */
function mapProject(
  id: string,
  userId: string,
  data: any,
  photos: Photo[] = []
): Project {
  return {
    id,
    title: data.title || "Imóvel",
    address: data.address || "",
    createdAt: typeof data.createdAt === "number"
      ? data.createdAt
      : Date.now(),
    userId,
    status: data.status,
    details: data.details || {},
    coverImage: data.coverImage,
    contacts: data.contacts || [],
    photos,
  };
}

/**
 * Converte dados Firestore em Photo
 */
function mapPhoto(id: string, data: any): Photo {
  return {
    id,
    url: data.url,
    originalUrl: data.originalUrl,
    name: data.name,
    type: data.type,
    timestamp: data.timestamp ?? Date.now(),
    createdAt: data.createdAt,
    linkedTo: data.linkedTo,
  };
}

/**
 * Carrega todas as fotos de um projeto (subcoleção)
 */
async function fetchPhotos(userId: string, projectId: string): Promise<Photo[]> {
  const snap = await getDocs(photosCollection(userId, projectId));
  const photos: Photo[] = [];
  snap.forEach((pDoc) => {
    photos.push(mapPhoto(pDoc.id, pDoc.data()));
  });
  // opcional: ordenar por timestamp
  return photos.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

/**
 * Lista todos os projetos de um utilizador (com fotos)
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const colRef = projectsCollection(userId);
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const projects: Project[] = [];

  for (const pDoc of snap.docs) {
    const data = pDoc.data();
    const photos = await fetchPhotos(userId, pDoc.id);
    projects.push(mapProject(pDoc.id, userId, data, photos));
  }

  return projects;
}

/**
 * Cria novo projeto para o utilizador atual.
 * Espera um "base" igual ao que o App.tsx está a construir:
 * Omit<Project, "id" | "createdAt" | "photos">
 */
export async function createProject(
  base: Omit<Project, "id" | "createdAt" | "photos">
): Promise<Project> {
  const userId = base.userId || auth.currentUser?.uid;
  if (!userId) {
    throw new Error("Utilizador não autenticado (userId em falta).");
  }

  const now = Date.now();

  const colRef = projectsCollection(userId);
  const docRef = await addDoc(colRef, {
    title: base.title,
    address: base.address ?? "",
    status: base.status ?? "draft",
    details: base.details ?? {},
    coverImage: base.coverImage ?? null,
    contacts: base.contacts ?? [],
    userId,
    createdAt: now,
    updatedAt: now,
  });

  // projeto inicialmente sem fotos
  return {
    id: docRef.id,
    title: base.title,
    address: base.address ?? "",
    createdAt: now,
    userId,
    status: base.status ?? "draft",
    details: base.details ?? {},
    coverImage: base.coverImage,
    contacts: base.contacts ?? [],
    photos: [],
  };
}

/**
 * Apaga um projeto (e opcionalmente poderias apagar fotos e imagens no Storage)
 */
export async function deleteProject(projectId: string): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("Utilizador não autenticado.");

  const pRef = projectDoc(userId, projectId);
  await deleteDoc(pRef);

  // Se quiseres, aqui podias apagar as fotos da subcoleção e do Storage.
}

/**
 * Atualiza um projeto, incluindo sincronizar as fotos na subcoleção
 */
export async function updateProject(project: Project): Promise<Project> {
  const userId = project.userId || auth.currentUser?.uid;
  if (!userId) throw new Error("Utilizador não autenticado.");

  const pRef = projectDoc(userId, project.id);

  // Atualizar campos principais do projeto (sem fotos)
  await updateDoc(pRef, {
    title: project.title,
    address: project.address ?? "",
    status: project.status ?? "draft",
    details: project.details ?? {},
    coverImage: project.coverImage ?? null,
    contacts: project.contacts ?? [],
    updatedAt: Date.now(),
  });

  // Sincronizar fotos na subcoleção
  if (project.photos && project.photos.length > 0) {
    const photosCol = photosCollection(userId, project.id);

    for (const photo of project.photos) {
      const photoRef = doc(photosCol, photo.id);
      await updateDoc(photoRef, {
        url: photo.url,
        originalUrl: photo.originalUrl ?? photo.url,
        name: photo.name,
        type: photo.type,
        timestamp: photo.timestamp ?? Date.now(),
        createdAt: photo.createdAt ?? Date.now(),
        linkedTo: photo.linkedTo ?? null,
      }).catch(async (err) => {
        // Se ainda não existir, cria
        if ((err as any).code === "not-found") {
          await addDoc(photosCol, {
            id: photo.id,
            url: photo.url,
            originalUrl: photo.originalUrl ?? photo.url,
            name: photo.name,
            type: photo.type,
            timestamp: photo.timestamp ?? Date.now(),
            createdAt: photo.createdAt ?? Date.now(),
            linkedTo: photo.linkedTo ?? null,
          });
        } else {
          console.error("[updateProject] erro ao sincronizar foto:", err);
        }
      });
    }
  }

  // Recarregar projeto atualizado + fotos da BD
  const pSnap = await getDoc(pRef);
  const data = pSnap.data() || {};
  const photos = await fetchPhotos(userId, project.id);

  return mapProject(project.id, userId, data, photos);
}
