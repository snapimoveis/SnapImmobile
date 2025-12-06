// services/storage.ts
import { db, storage } from "../services/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Project, Photo } from "../types";

// -------------------------------------------------------
// Salvar imóvel no Firestore de forma real
// -------------------------------------------------------
export async function createProject(project: Omit<Project, "id">) {
  try {
    // 1. Upload das fotos
    const uploadedPhotos: Photo[] = [];

    for (const photo of project.photos) {
      const storageRef = ref(storage, `projects/${Date.now()}_${photo.id}.jpg`);

      // upload base64
      await uploadString(storageRef, photo.base64, "data_url");

      const url = await getDownloadURL(storageRef);

      uploadedPhotos.push({
        ...photo,
        url,
      });
    }

    // 2. Criar documento no Firestore
    const docRef = await addDoc(collection(db, "projects"), {
      ...project,
      photos: uploadedPhotos,
      createdAt: Timestamp.now(),
    });

    return { success: true, id: docRef.id };

  } catch (error) {
    console.log("Erro ao criar imóvel:", error);
    return { success: false, error };
  }
}

// -------------------------------------------------------
// LocalStorage (mantemos como cache local opcional)
// -------------------------------------------------------
export function getProjectsLocal(): Project[] {
  try {
    const raw = localStorage.getItem("projects");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProjects(list: Project[]) {
  localStorage.setItem("projects", JSON.stringify(list));
}
