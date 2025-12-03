// App.tsx

import React, { useEffect, useState } from "react";

// COMPONENTES
import { LandingScreen } from "./components/LandingScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { MainLayout } from "./components/MainLayout";
import { CameraView } from "./components/CameraView";
import { Editor } from "./components/Editor";

// TIPOS
import {
  AppRoute,
  Project,
  Photo,
  ToolMode,
  UserProfile,
} from "./types";

// SERVIÇOS
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from "./services/auth";

import {
  getProjects,
  createProject,
  deleteProject,
  updateProject,
} from "./services/api";

import { generateDescription } from "./services/geminiService";
import { saveProjects } from "./services/storage";

// -------------------------------------------
// APP
// -------------------------------------------

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editorMode] = useState<ToolMode>(ToolMode.MAGIC_ERASE);

  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // -------------------------------------------
  // LOAD USER + PROJECTS NA INICIALIZAÇÃO
  // -------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        const list = await getProjects(user.id);
        setProjects(list);
        setRoute(AppRoute.DASHBOARD);
      } catch (err) {
        console.error("[App:init] erro:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // -------------------------------------------
  // AUTH
  // -------------------------------------------

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const user = await loginUser(email, password);
      setCurrentUser(user);

      const list = await getProjects(user.id);
      setProjects(list);
      setRoute(AppRoute.DASHBOARD);
    } catch (err: any) {
      console.error("[handleLogin] erro:", err);
      setAuthError(err.message || "Erro ao iniciar sessão.");
    }
  };

  const handleRegister = async (data: any) => {
    setAuthError(null);
    try {
      // ✔️ CORREÇÃO 1 — registerUser precisa de 4 argumentos
      const user = await registerUser(
        data.firstName ?? "",
        data.lastName ?? "",
        data.email ?? "",
        data.password ?? ""
      );

      setCurrentUser(user);

      const list = await getProjects(user.id);
      setProjects(list);
      setRoute(AppRoute.DASHBOARD);
    } catch (err: any) {
      console.error("[handleRegister] erro:", err);
      setAuthError(err.message || "Erro ao criar conta.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setProjects([]);
      setSelectedProject(null);
      setRoute(AppRoute.LANDING);
    } catch (err) {
      console.error("[handleLogout] erro:", err);
    }
  };

  // -------------------------------------------
  // PROJECTS
  // -------------------------------------------

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setRoute(AppRoute.PROJECT_DETAILS);
  };

  const handleCreateProject = async () => {
    if (!currentUser) return;

    try {
      const base = {
        userId: currentUser.id,
        title: "Novo imóvel",
        address: "",
        status: "draft",
        details: {},
        coverImage: undefined,
        contacts: [],
        photos: [], // ✔️ CORREÇÃO 2 — createProject exige "photos"
      };

      const newProject = await createProject(base);

      const updated = [...projects, newProject];
      setProjects(updated);
      setSelectedProject(newProject);
      setRoute(AppRoute.PROJECT_DETAILS);
    } catch (err) {
      console.error("[handleCreateProject] erro:", err);
      alert("Não foi possível criar o imóvel.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);

      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setRoute(AppRoute.DASHBOARD);
      }
    } catch (err) {
      console.error("[handleDeleteProject] erro:", err);
      alert("Não foi possível eliminar o imóvel.");
    }
  };

  const handleUpdateProjectLocal = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject(updatedProject);

    saveProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  // -------------------------------------------
  // FOTOS
  // -------------------------------------------

  const handleOpenCamera = () => {
    if (!selectedProject) return;
    setRoute(AppRoute.CAMERA);
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!selectedProject) return;
    if (!currentUser) return;

    try {
      let title = selectedProject.title;

      if (!title || title === "Novo imóvel") {
        try {
          title = await generateDescription(photo.url);
        } catch {
          title = selectedProject.title || "Imóvel";
        }
      }

      const newPhoto: Photo = {
        ...photo,
        timestamp: Date.now(),
        createdAt: Date.now(),
      };

      const updatedProject: Project = {
        ...selectedProject,
        title,
        photos: [...selectedProject.photos, newPhoto],
        coverImage: selectedProject.coverImage || newPhoto.url,
      };

      const saved = await updateProject(updatedProject);

      const updatedList = projects.map((p) =>
        p.id === saved.id ? saved : p
      );

      setProjects(updatedList);
      setSelectedProject(saved);
      setRoute(AppRoute.PROJECT_DETAILS);
    } catch (err) {
      console.error("[handlePhotoCaptured] erro:", err);
      alert("Não foi possível guardar a foto.");
    }
  };

  const openEditor = (photo: Photo) => {
    setEditingPhoto(photo);
    setRoute(AppRoute.EDITOR);
  };

  const handleSavePhoto = async (newPhoto: Photo) => {
    if (!selectedProject) return;

    try {
      const updatedPhotos = selectedProject.photos.map((p) =>
        p.id === newPhoto.id ? newPhoto : p
      );

      const updatedProject: Project = {
        ...selectedProject,
        photos: updatedPhotos,
        coverImage: updatedPhotos[0]?.url,
      };

      const saved = await updateProject(updatedProject);

      const updatedList = projects.map((p) =>
        p.id === saved.id ? saved : p
      );

      setProjects(updatedList);
      setSelectedProject(saved);
      setEditingPhoto(null);
      setRoute(AppRoute.PROJECT_DETAILS);
    } catch (err) {
      console.error("[handleSavePhoto] erro:", err);
      alert("Não foi possível guardar as alterações.");
    }
  };

  // -------------------------------------------
  // RENDER
  // -------------------------------------------

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        A iniciar Snap Immobile...
      </div>
    );
  }

  if (!currentUser) {
    if (route === AppRoute.LOGIN) {
      return (
        <LoginScreen
          error={authError ?? undefined}
          onLogin={handleLogin}
          onBack={() => setRoute(AppRoute.LANDING)}
          onRegisterClick={() => setRoute(AppRoute.REGISTER)}
        />
      );
    }

    if (route === AppRoute.REGISTER) {
      return (
        <RegisterScreen
          error={authError ?? undefined}
          onBack={() => setRoute(AppRoute.LANDING)}
          onSubmit={handleRegister}
        />
      );
    }

    return (
      <LandingScreen
        onLogin={() => setRoute(AppRoute.LOGIN)}
        onFreeTrial={() => setRoute(AppRoute.REGISTER)}
      />
    );
  }

  return (
    <MainLayout
      currentRoute={route}
      onNavigate={setRoute}
      currentUser={currentUser}
      onLogout={handleLogout}
      projects={projects}
      onSelectProject={setSelectedProject}
      onCreateProject={handleCreateProject}
      onDeleteProject={handleDeleteProject}
    >
      {route === AppRoute.CAMERA && selectedProject && (
        <CameraView
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => setRoute(AppRoute.PROJECT_DETAILS)}
        />
      )}

      {route === AppRoute.EDITOR && editingPhoto && (
        <Editor
          photo={editingPhoto}
          onCancel={() => {
            setEditingPhoto(null);
            setRoute(AppRoute.PROJECT_DETAILS);
          }}
          onSave={handleSavePhoto}
        />
      )}
    </MainLayout>
  );
};

export default App;
