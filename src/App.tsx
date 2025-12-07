// App.tsx

import React, { useEffect, useState } from "react";

// COMPONENTES
import LandingScreen from "./components/LandingScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { MainLayout } from "./components/MainLayout";
import { CameraView } from "./components/CameraView";
import { Editor } from "./components/Editor";

import { applySystemTheme, listenToThemeChanges } from "./theme";

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

// Firebase
import { auth } from "./services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editorMode] = useState<ToolMode>(ToolMode.MAGIC_ERASE);

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // -----------------------------------------------------
  // TEMA DO SISTEMA
  // -----------------------------------------------------
  useEffect(() => {
    applySystemTheme();
    listenToThemeChanges();
  }, []);

  // -----------------------------------------------------
  // AUTENTICAÇÃO AUTOMÁTICA
  // -----------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const profile = await getCurrentUser();
      if (!profile) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(profile);

      const list = await getProjects(profile.id);
      setProjects(list);

      setRoute(AppRoute.DASHBOARD);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------
  // LOGIN
  // -----------------------------------------------------
  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const profile = await loginUser(email, password);
      setCurrentUser(profile);

      const list = await getProjects(profile.id);
      setProjects(list);

      setRoute(AppRoute.DASHBOARD);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // -----------------------------------------------------
  // REGISTO
  // -----------------------------------------------------
  const handleRegister = async (data: any) => {
    setAuthError(null);
    try {
      const profile = await registerUser(
        data.firstName,
        data.lastName,
        data.email,
        data.password
      );

      setCurrentUser(profile);
      const list = await getProjects(profile.id);
      setProjects(list);

      setRoute(AppRoute.DASHBOARD);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // -----------------------------------------------------
  // LOGOUT
  // -----------------------------------------------------
  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setProjects([]);
    setSelectedProject(null);
    setRoute(AppRoute.LANDING);
  };

  // -----------------------------------------------------
  // PROJETOS
  // -----------------------------------------------------
  const handleCreateProject = async () => {
    if (!currentUser) return;

    const base = {
      userId: currentUser.id,
      title: "Novo imóvel",
      address: "",
      status: "draft",
      details: {},
      coverImage: undefined,  // 🔥 NUNCA null
      contacts: [],
    };

    try {
      const newProject = await createProject(base);
      const updated = [...projects, newProject];

      setProjects(updated);
      setSelectedProject(newProject);
      setRoute(AppRoute.PROJECT_DETAILS);
    } catch (err) {
      console.error(err);
      alert("Não foi possível criar o imóvel.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    const updated = projects.filter((p) => p.id !== id);

    setProjects(updated);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setRoute(AppRoute.DASHBOARD);
    }
  };

  const handleUpdateProjectLocal = (p: Project) => {
    setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setSelectedProject(p);
    saveProjects(projects);
  };

  // -----------------------------------------------------
  // FOTOS
  // -----------------------------------------------------
  const handleOpenCamera = () => {
    if (selectedProject) setRoute(AppRoute.CAMERA);
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!selectedProject) return;

    const newPhoto = {
      ...photo,
      timestamp: Date.now(),
      createdAt: Date.now(),
    };

    try {
      const updatedProject: Project = {
        ...selectedProject,
        photos: [...selectedProject.photos, newPhoto],
        coverImage: selectedProject.coverImage || newPhoto.url,
      };

      const saved = await updateProject(updatedProject);

      setProjects((p) => p.map((x) => (x.id === saved.id ? saved : x)));
      setSelectedProject(saved);
      setRoute(AppRoute.PROJECT_DETAILS);
    } catch (err) {
      console.error(err);
      alert("Erro ao guardar foto.");
    }
  };

  const openEditor = (photo: Photo) => {
    setEditingPhoto(photo);
    setRoute(AppRoute.EDITOR);
  };

  const handleSavePhoto = async (photo: Photo) => {
    if (!selectedProject) return;

    const updatedPhotos = selectedProject.photos.map((p) =>
      p.id === photo.id ? photo : p
    );

    const updatedProject = {
      ...selectedProject,
      photos: updatedPhotos,
      coverImage: updatedPhotos[0]?.url,
    };

    const saved = await updateProject(updatedProject);

    setProjects((p) => p.map((x) => (x.id === saved.id ? saved : x)));
    setSelectedProject(saved);

    setEditingPhoto(null);
    setRoute(AppRoute.PROJECT_DETAILS);
  };

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white bg-black">
        A iniciar Snap Immobile...
      </div>
    );
  }

  if (!currentUser) {
    if (route === AppRoute.LOGIN)
      return (
        <LoginScreen
          error={authError ?? undefined}
          onLogin={handleLogin}
          onBack={() => setRoute(AppRoute.LANDING)}
          onRegisterClick={() => setRoute(AppRoute.REGISTER)}
        />
      );

    if (route === AppRoute.REGISTER)
      return (
        <RegisterScreen
          error={authError ?? undefined}
          onBack={() => setRoute(AppRoute.LANDING)}
          onSubmit={handleRegister}
        />
      );

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
      onSelectProject={(p) => {
        setSelectedProject(p);
        setRoute(AppRoute.PROJECT_DETAILS);
      }}
      onCreateProject={handleCreateProject}
      onDeleteProject={handleDeleteProject}
    >
      {route === AppRoute.CAMERA && selectedProject && (
        <CameraView
          project={selectedProject}
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
