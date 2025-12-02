import React, { useEffect, useState } from "react";

// -----------------------------------
// IMPORTS DE TIPOS E SERVIÇOS
// -----------------------------------
import { AppRoute, Photo, Project, UserProfile } from "./types";
import { saveUserSession, loadUserSession, logoutUser } from "./services/auth";
import { registerUser, loginUser } from "./services/api";
import {
  ensureTrialInfo,
  canAddPhotoToProject,
  canCreateNewProperty,
} from "./services/subscription";
import { startAsaasCheckout } from "./services/billing";

// -----------------------------------
// IMPORT DOS SCREENS
// -----------------------------------
import { LandingScreen } from "./components/LandingScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import ProjectList from "./components/ProjectList";
import ProjectDetail from "./components/ProjectDetail";
import { CameraView } from "./components/CameraView";
import { Editor } from "./components/Editor";
import { SettingsScreen } from "./components/SettingsScreen";

// -----------------------------------
// APP PRINCIPAL
// -----------------------------------

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LANDING);

  // -----------------------------------
  // LOAD SESSION
  // -----------------------------------
  useEffect(() => {
    const session = loadUserSession();
    if (session) {
      setCurrentUser(session);
      setCurrentRoute(AppRoute.DASHBOARD);
    }
  }, []);

  // -----------------------------------
  // LOGOUT
  // -----------------------------------
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setProjects([]);
    setActiveProject(null);
    setCurrentRoute(AppRoute.LANDING);
  };

  // -----------------------------------
  // REGISTO
  // -----------------------------------
  const handleRegister = async (data: any) => {
    try {
      let user: UserProfile = {
        id: crypto.randomUUID(),
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        createdAt: Date.now(),
      };

      // Inicializa TESTE GRÁTIS
      user = ensureTrialInfo(user);

      const saved = await registerUser(user, data.password);
      saveUserSession(saved);

      setCurrentUser(saved);
      setProjects([]);
      setCurrentRoute(AppRoute.DASHBOARD);
    } catch (error: any) {
      alert(error.message || "Erro ao criar conta");
    }
  };

  // -----------------------------------
  // LOGIN
  // -----------------------------------
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await loginUser(email, password);
      saveUserSession(user);
      setCurrentUser(user);
      setCurrentRoute(AppRoute.DASHBOARD);
    } catch {
      alert("Email ou senha incorretos.");
    }
  };

  // -----------------------------------
  // CRIAR IMÓVEL
  // -----------------------------------
  const handleCreateProject = () => {
    if (!currentUser) return;

    const can = canCreateNewProperty(currentUser, projects);

    if (!can) {
      alert(
        "No teste gratuito só pode criar 1 imóvel.\nFaça upgrade para continuar."
      );
      return;
    }

    const p: Project = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title: "Novo Imóvel",
      address: "Endereço",
      createdAt: Date.now(),
      photos: [],
    };

    setProjects([...projects, p]);
    setActiveProject(p);
    setCurrentRoute(AppRoute.DETAILS);
  };

  // -----------------------------------
  // ADICIONAR FOTO
  // -----------------------------------
  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser || !activeProject) return;

    const can = canAddPhotoToProject(currentUser, activeProject);

    if (!can) {
      alert(
        "No teste gratuito pode adicionar até 20 fotos por imóvel.\nFaça upgrade para continuar."
      );
      return;
    }

    const updated = {
      ...activeProject,
      photos: [...(activeProject.photos || []), photo],
    };

    setActiveProject(updated);
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  // -----------------------------------
  // ACTUALIZAR FOTO (editor)
  // -----------------------------------
  const handleSavePhoto = (photo: Photo) => {
    if (!activeProject) return;

    const updated = {
      ...activeProject,
      photos: activeProject.photos?.map((p) =>
        p.id === photo.id ? photo : p
      ),
    };

    setActiveProject(updated);
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    setActivePhoto(null);
  };

  // -----------------------------------
  // APAGAR IMÓVEL
  // -----------------------------------
  const handleDeleteProject = (id: string) => {
    if (!window.confirm("Tem a certeza que deseja eliminar este imóvel?"))
      return;

    setProjects(projects.filter((p) => p.id !== id));
  };

  // -----------------------------------
  // UPGRADE ASSINATURA
  // -----------------------------------
  const handleUpgrade = async () => {
    if (!currentUser) return;

    try {
      const url = await startAsaasCheckout(currentUser);
      if (url) window.location.href = url;
    } catch (err: any) {
      alert(err.message || "Erro ao iniciar upgrade.");
    }
  };

  // -----------------------------------
  // RENDER PÁGINAS
  // -----------------------------------
  if (currentRoute === AppRoute.LANDING)
    return (
      <LandingScreen
        onLogin={() => setCurrentRoute(AppRoute.LOGIN)}
        onFreeTrial={() => setCurrentRoute(AppRoute.REGISTER)}
      />
    );

  if (currentRoute === AppRoute.LOGIN)
    return (
      <LoginScreen
        onLogin={handleLogin}
        onBack={() => setCurrentRoute(AppRoute.LANDING)}
      />
    );

  if (currentRoute === AppRoute.REGISTER)
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onBack={() => setCurrentRoute(AppRoute.LANDING)}
      />
    );

  if (currentRoute === AppRoute.DASHBOARD)
    return (
      <ProjectList
        projects={projects}
        currentUser={currentUser}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onSelectProject={(p) => {
          setActiveProject(p);
          setCurrentRoute(AppRoute.DETAILS);
        }}
      />
    );

  if (currentRoute === AppRoute.DETAILS && activeProject)
    return (
      <ProjectDetail
        initialProject={activeProject}
        onBack={() => setCurrentRoute(AppRoute.DASHBOARD)}
        onAddPhoto={() => setCurrentRoute(AppRoute.CAMERA)}
        onEditPhoto={(photo) => {
          setActivePhoto(photo);
          setCurrentRoute(AppRoute.EDITOR);
        }}
      />
    );

  if (currentRoute === AppRoute.CAMERA && activeProject)
    return (
      <CameraView
        onPhotoCaptured={handlePhotoCaptured}
        onClose={() => setCurrentRoute(AppRoute.DETAILS)}
      />
    );

  if (currentRoute === AppRoute.EDITOR && activePhoto)
    return (
      <Editor
        photo={activePhoto}
        onCancel={() => setCurrentRoute(AppRoute.DETAILS)}
        onSave={handleSavePhoto}
      />
    );

  if (currentRoute === AppRoute.SETTINGS)
    return (
      <SettingsScreen
        currentUser={currentUser}
        onDeleteAccount={handleLogout}
        onUpdateUser={(u: UserProfile) => console.log(u)}
      />
    );

  return <div>Erro: rota desconhecida</div>;
}
