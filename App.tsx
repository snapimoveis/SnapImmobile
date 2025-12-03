import React, { useState, useEffect } from "react";

// Layout e Screens
import { MainLayout } from "./components/MainLayout";
import LandingScreen from "./components/LandingScreen";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import ProjectList from "./components/ProjectList";
import ProjectDetail from "./components/ProjectDetail";
import CameraView from "./components/CameraView";
import Editor from "./components/Editor";

// Types
import { AppRoute, Project, Photo, UserProfile } from "./types";

// Serviços locais (sem backend)
import { authService } from "./services/auth";
import { api } from "./services/api";

export default function App() {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editorPhoto, setEditorPhoto] = useState<Photo | null>(null);

  // ========================================================================
  //  Load inicial (usuário + projetos)
  // ========================================================================
  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) {
      setCurrentUser(u);
      setProjects(api.getProjects(u.id));
      setRoute(AppRoute.DASHBOARD);
    }
  }, []);

  // ========================================================================
  //  LOGIN
  // ========================================================================
  const handleLogin = async (email: string, password: string) => {
    const user = authService.login(email, password);
    if (!user) {
      alert("Credenciais inválidas.");
      return;
    }

    setCurrentUser(user);
    setProjects(api.getProjects(user.id));
    setRoute(AppRoute.DASHBOARD);
  };

  // ========================================================================
  //  REGISTO
  // ========================================================================
  const handleRegister = async (data: any) => {
    const user = authService.register(data);
    setCurrentUser(user);
    setProjects([]);
    setRoute(AppRoute.DASHBOARD);
  };

  // ========================================================================
  //  LOGOUT
  // ========================================================================
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setRoute(AppRoute.LANDING);
  };

  // ========================================================================
  //  CRIAR PROJETO
  // ========================================================================
  const handleCreateProject = () => {
    if (!currentUser) return;

    const newProject = api.createProject(currentUser.id);
    setProjects(api.getProjects(currentUser.id));

    setSelectedProject(newProject);
    setRoute(AppRoute.PROJECT_DETAILS);
  };

  // ========================================================================
  //  CAPTURA DE FOTO
  // ========================================================================
  const handlePhotoCaptured = async (photo: Photo) => {
    if (!selectedProject) return;

    const updated = api.addPhoto(selectedProject.id, photo);
    setSelectedProject(updated);
    setProjects(api.getProjects(currentUser!.id));
  };

  // ========================================================================
  //  SALVAR FOTO EDITADA
  // ========================================================================
  const handleSaveEditedPhoto = (updatedPhoto: Photo) => {
    if (!selectedProject) return;

    const updated = api.updatePhoto(selectedProject.id, updatedPhoto);
    setSelectedProject(updated);

    setEditorPhoto(null);
  };

  // ========================================================================
  //  DELETAR PROJETO
  // ========================================================================
  const handleDeleteProject = (id: string) => {
    api.deleteProject(id);
    setProjects(api.getProjects(currentUser!.id));
  };

  // ========================================================================
  //  RENDER
  // ========================================================================
  return (
    <div className="bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white h-screen w-screen overflow-hidden">
      {/* ========================= LANDING ========================= */}
      {route === AppRoute.LANDING && (
        <LandingScreen
          onLogin={() => setRoute(AppRoute.LOGIN)}
          onFreeTrial={() => setRoute(AppRoute.REGISTER)}
        />
      )}

      {/* ========================= LOGIN ========================= */}
      {route === AppRoute.LOGIN && (
        <LoginScreen
          onBack={() => setRoute(AppRoute.LANDING)}
          onLogin={handleLogin}
        />
      )}

      {/* ========================= REGISTER ========================= */}
      {route === AppRoute.REGISTER && (
        <RegisterScreen
          onBack={() => setRoute(AppRoute.LANDING)}
          onSubmit={handleRegister}
        />
      )}

      {/* ========================= DASHBOARD / LISTA ========================= */}
      {route === AppRoute.DASHBOARD && currentUser && (
        <MainLayout
          currentRoute={route}
          onNavigate={setRoute}
          onLogout={handleLogout}
          onCameraAction={handleCreateProject}
        >
          <ProjectList
            projects={projects}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onSelectProject={(p) => {
              setSelectedProject(p);
              setRoute(AppRoute.PROJECT_DETAILS);
            }}
          />
        </MainLayout>
      )}

      {/* ========================= DETALHES DO PROJETO ========================= */}
      {route === AppRoute.PROJECT_DETAILS && selectedProject && (
        <MainLayout
          currentRoute={route}
          onNavigate={setRoute}
          onLogout={handleLogout}
          onCameraAction={() => setRoute(AppRoute.CAMERA)}
        >
          <ProjectDetail
            initialProject={selectedProject}
            onBack={() => setRoute(AppRoute.DASHBOARD)}
            onAddPhoto={() => setRoute(AppRoute.CAMERA)}
            onEditPhoto={(photo) => setEditorPhoto(photo)}
            onUpdateProject={(p) => {
              api.updateProject(p.id, p);
              setSelectedProject(p);
              setProjects(api.getProjects(currentUser!.id));
            }}
          />
        </MainLayout>
      )}

      {/* ========================= CÂMERA ========================= */}
      {route === AppRoute.CAMERA && selectedProject && (
        <CameraView
          onClose={() => setRoute(AppRoute.PROJECT_DETAILS)}
          onPhotoCaptured={handlePhotoCaptured}
        />
      )}

      {/* ========================= EDITOR ========================= */}
      {editorPhoto && (
        <Editor
          photo={editorPhoto}
          onCancel={() => setEditorPhoto(null)}
          onSave={handleSaveEditedPhoto}
        />
      )}
    </div>
  );
}
