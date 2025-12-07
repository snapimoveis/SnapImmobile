// services/api.ts
// API de projetos 100% Firebase Firestore

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

// ✅ Caminho corrigido (arquivo real)
import { db, auth } from "./firebaseConfig";

import { Project, Photo, ProjectDetails, Contact } from "../types";

/* ===========================================================
   HELPERS
=========================================================== */

// coverImage NUNCA pode ser null no tipo Project → corrigimos aqui
function safeCover(val: any): string | undefined {
  if (typeof val === "string" && val.trim() !== "") return val;
  return undefined;
}

/* ===========================================================
   REFERÊNCIAS DO FIRESTORE
=========================================================== */

function projectsCollection(userId: string) {
  return collection(db, "users", userId, "projects");
}

function projectDoc(userId: string, projectId: string) {
  return doc(db, "users", userId, "projects", projectId);
}

function photosCollection(userId: string, projectId: string) {
  return collection(db, "users", userId, "projects", projectId, "photos");
}

/* ===========================================================
   MAPEAMENTO PROJECT / PHOTO
=========================================================== */

function mapPhoto(id: string, data: any): Photo {
  return {
    id,
    url: data.url,
    originalUrl: data.originalUrl,
    name: data.name,
    type: data.type,
    timestamp: data.timestamp ?? Date.now(),
    createdAt: data.createdAt ?? Date.now(),
    linkedTo: data.linkedTo,
  };
}

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
    createdAt: data.createdAt ?? Date.now(),
    userId,
    status: data.status ?? "draft",
    details: (data.details || {}) as ProjectDetails,
    coverImage: safeCover(data.coverImage),
    contacts: (data.contacts || []) as Contact[],
    photos,
  };
}

/* ===========================================================
   FETCH DE PHOTOS
=========================================================== */

async function fetchPhotos(userId: string, projectId: string): Promise<Photo[]> {
  const snap = await getDocs(photosCollection(userId, projectId));
  const list: Photo[] = [];

  snap.forEach((pDoc) => list.push(mapPhoto(pDoc.id, pDoc.data())));

  return list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

/* ===========================================================
   GET PROJECTS
=========================================================== */

export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(projectsCollection(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const list: Project[] = [];

  for (const item of snap.docs) {
    const data = item.data();
    const photos = await fetchPhotos(userId, item.id);
    list.push(mapProject(item.id, userId, data, photos));
  }

  return list;
}

/* ===========================================================
   CREATE PROJECT — COMPLETO
=========================================================== */

export async function createProject(
  base: Omit<Project, "id" | "createdAt" | "photos">
): Promise<Project> {
  const userId = base.userId || auth.currentUser?.uid;

  if (!userId) throw new Error("Utilizador não autenticado.");

  const now = Date.now();

  const colRef = projectsCollection(userId);

  // Firestore aceita updatedAt — só não existe no tipo Project
  const docRef = await addDoc(colRef, {
    title: base.title,
    address: base.address || "",
    status: base.status || "draft",
    details: base.details || {},
    coverImage: safeCover(base.coverImage) ?? null,
    contacts: base.contacts || [],
    userId,
    createdAt: now,
    updatedAt: now,
  });

  // Retorno deve seguir EXATAMENTE o tipo Project
  return {
    id: docRef.id,
    title: base.title,
    address: base.address || "",
    createdAt: now,
    userId,
    status: base.status || "draft",
    details: (base.details || {}) as ProjectDetails,
    coverImage: safeCover(base.coverImage),
    contacts: (base.contacts || []) as Contact[],
    photos: [],
  };
}

/* ===========================================================
   DELETE PROJECT
=========================================================== */

export async function deleteProject(projectId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilizador não autenticado.");

  await deleteDoc(projectDoc(user.uid, projectId));
}

/* ===========================================================
   UPDATE PROJECT — COMPLETO
=========================================================== */

export async function updateProject(project: Project): Promise<Project> {
  const userId = project.userId || auth.currentUser?.uid;

  if (!userId) throw new Error("Utilizador não autenticado.");

  const ref = projectDoc(userId, project.id);

  await updateDoc(ref, {
    title: project.title,
    address: project.address || "",
    status: project.status || "draft",
    details: project.details || {},
    coverImage: safeCover(project.coverImage) ?? null,
    contacts: project.contacts || [],
    updatedAt: Date.now(),
  });

  // FOTOS
  const photosCol = photosCollection(userId, project.id);

  for (const photo of project.photos) {
    const pRef = doc(photosCol, photo.id);

    await updateDoc(pRef, {
      url: photo.url,
      originalUrl: photo.originalUrl ?? photo.url,
      name: photo.name,
      type: photo.type,
      timestamp: photo.timestamp ?? Date.now(),
      createdAt: photo.createdAt ?? Date.now(),
      linkedTo: photo.linkedTo ?? null,
    }).catch(async () => {
      // Se não existir, cria
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
    });
  }

  // Recarregar do Firestore
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  const photos = await fetchPhotos(userId, project.id);

  return mapProject(project.id, userId, data, photos);
}
