// App.tsx
import React, { useEffect, useState } from "react";
import "./index.css";

import { AppRoute, Project, UserProfile, Photo } from "./types";

// Componentes de UI
import { LandingScreen } from "./components/LandingScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import ProjectList from "./components/ProjectList";
import ProjectDetail from "./components/ProjectDetail";
import { CameraView } from "./components/CameraView";
import { Editor } from "./components/Editor";

// Serviços
import {
  login,
  register,
  logout,
  getCurrentUser,
} from "./services/auth";

import {
  getProjects,
  createProject,
  deleteProject,
  updateProject,
} from "./services/api";

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [editorPhoto, setEditorPhoto] = useState<Photo | null>(null);

  // =====================================
  // LOAD USER + PROJECTS
  // =====================================
  useEffect(() => {
    const bootstrap = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setRoute(AppRoute.LANDING);
        return;
      }

      setCurrentUser(user);
      const userProjects = await getProjects(user.id);
      setProjects(userProjects);

      setRoute(AppRoute.DASHBOARD);
    };

    bootstrap();
  }, []);

  const reloadProjects = async () => {
    if (!currentUser) return;
    const list = await getProjects(currentUser.id);
    setProjects(list);
  };

  // =====================================
  // AUTH
  // =====================================
  const handleLogin = async (email: string, password?: string) => {
    const user = await login(email, password ?? "");
    setCurrentUser(user);
    const list = await getProjects(user.id);
    setProjects(list);
    setRoute(AppRoute.DASHBOARD);
  };

  const handleRegister = async (data: any) => {
    const user = await register(data);
    setCurrentUser(user);
    const list = await getProjects(user.id);
    setProjects(list);
    setRoute(AppRoute.DASHBOARD);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setProjects([]);
    setSelectedProject(null);
    setRoute(AppRoute.LANDING);
  };

  // =====================================
  // PROJECTS
  // =====================================
  const handleCreateProject = async () => {
    if (!currentUser) return;
    const project = await createProject(currentUser.id);

    setProjects((prev) => [...prev, project]);
    setSelectedProject(project);
    setRoute(AppRoute.PROJECT_DETAILS);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));

    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setRoute(AppRoute.DASHBOARD);
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setRoute(AppRoute.PROJECT_DETAILS);
  };

  const handleUpdateProject = async (project: Project) => {
    const saved = await updateProject(project);
    setProjects((prev) =>
      prev.map((p) => (p.id === saved.id ? saved : p))
    );
    setSelectedProject(saved);
  };

  // =====================================
  // CAMERA + PHOTOS
  // =====================================
  const openCamera = () => {
    if (!selectedProject) return;
    setShowCamera(true);
  };

  const closeCamera = () => {
    setShowCamera(false);
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!selectedProject) {
      setShowCamera(false);
      return;
    }

    // adiciona foto localmente
    const updated: Project = {
      ...selectedProject,
      photos: [...(selectedProject.photos || []), photo],
      coverImage: selectedProject.coverImage ?? photo.url,
    };

    const saved = await updateProject(updated);

    setProjects((prev) =>
      prev.map((p) => (p.id === saved.id ? saved : p))
    );
    setSelectedProject(saved);
    setShowCamera(false);
  };

  // =====================================
  // EDITOR
  // =====================================
  const openEditor = (photo: Photo) => {
    setEditorPhoto(photo);
  };

  const handleSaveEditedPhoto = async (updatedPhoto: Photo) => {
    if (!selectedProject) {
      setEditorPhoto(null);
      return;
    }

    const updatedPhotos = (selectedProject.photos || []).map((p) =>
      p.id === updatedPhoto.id ? updatedPhoto : p
    );

    const updatedProject: Project = {
      ...selectedProject,
      photos: updatedPhotos,
      coverImage:
        selectedProject.coverImage === updatedPhoto.url
          ? updatedPhoto.url
          : selectedProject.coverImage,
    };

    const saved = await updateProject(updatedProject);

    setProjects((prev) =>
      prev.map((p) => (p.id === saved.id ? saved : p))
    );
    setSelectedProject(saved);
    setEditorPhoto(null);
  };

  const closeEditor = () => {
    setEditorPhoto(null);
  };

  // =====================================
  // RENDER POR ROTA
  // =====================================
  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white">
      {/* LANDING (sem login) */}
      {!currentUser && route === AppRoute.LANDING && (
        <LandingScreen
          onLogin={() => setRoute(AppRoute.LOGIN)}
          onFreeTrial={() => setRoute(AppRoute.REGISTER)}
        />
      )}

      {/* LOGIN */}
      {!currentUser && route === AppRoute.LOGIN && (
        <LoginScreen
          onBack={() => setRoute(AppRoute.LANDING)}
          onRegisterClick={() => setRoute(AppRoute.REGISTER)}
          onLogin={(email: string, password?: string) => {
            void handleLogin(email, password);
          }}
        />
      )}

      {/* REGISTO */}
      {!currentUser && route === AppRoute.REGISTER && (
        <RegisterScreen
          role="Corretor"
          onBack={() => setRoute(AppRoute.LOGIN)}
          onSubmit={(data: any) => {
            void handleRegister(data);
          }}
        />
      )}

      {/* DASHBOARD (LISTA DE IMÓVEIS) */}
      {currentUser && route === AppRoute.DASHBOARD && (
        <ProjectList
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={handleSelectProject}
        />
      )}

      {/* DETALHE DO PROJETO */}
      {currentUser && route === AppRoute.PROJECT_DETAILS && selectedProject && (
        <ProjectDetail
          initialProject={selectedProject}
          onBack={() => setRoute(AppRoute.DASHBOARD)}
          onAddPhoto={openCamera}
          onEditPhoto={openEditor}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* CAMERA (overlay) */}
      {showCamera && (
        <CameraView
          onPhotoCaptured={handlePhotoCaptured}
          onClose={closeCamera}
        />
      )}

      {/* EDITOR (overlay) */}
      {editorPhoto && (
        <Editor
          photo={editorPhoto}
          onSave={handleSaveEditedPhoto}
          onCancel={closeEditor}
        />
      )}

      {/* Botão de logout simples quando logado */}
      {currentUser && (
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 px-4 py-2 rounded-full bg-black/80 text-white text-xs"
        >
          Sair
        </button>
      )}
    </div>
  );
};

export default App;
