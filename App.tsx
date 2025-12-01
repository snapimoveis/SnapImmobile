import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { CameraView } from './components/CameraView';
import { Editor } from './components/Editor';
import { ProjectDetail } from './components/ProjectDetail'; 
import { TourViewer } from './components/TourViewer';
import { NewProjectModal } from './components/NewProjectModal';
import { LandingScreen } from './components/LandingScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { LoginScreen } from './components/LoginScreen';
import { ManagementMenu } from './components/ManagementMenu';
import { UpdateNotification } from './components/UpdateNotification';
import { MainLayout } from './components/MainLayout';

import { AppRoute, Project, Photo, ProjectDetails as ProjectDetailsType, UserProfile } from './types';
import { generateDescription } from './services/geminiService';
import { 
    getCurrentUser, getUserProjects, saveProject, deleteProject, 
    logoutUser, registerUser, loginUser, saveUserSession, updateUser, deleteUserAccount
} from './services/storage';

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LANDING);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  // === MODO ESCURO AUTOMÁTICO ===
  useEffect(() => {
    const applyTheme = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    applyTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }, []);

  // Inicialização
  useEffect(() => {
    const initApp = async () => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        try {
          console.log("Carregando projetos para o utilizador:", user.id);
          const userProjects = await getUserProjects(user.id);
          console.log("Projetos carregados:", userProjects.length);
          setProjects(userProjects);
          setCurrentRoute(AppRoute.DASHBOARD);
        } catch (e) {
          console.error("Falha ao carregar projetos:", e);
        }
      }
    };
    initApp();
  }, []);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setCurrentRoute(AppRoute.REGISTER);
  };

  const handleRegistrationSubmit = async (data: any) => {
    try {
        const tempUser: UserProfile = {
            id: crypto.randomUUID(), 
            role: selectedRole as any,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            cpf: data.cpf,
            company: data.company,
            createdAt: Date.now(),
            password: data.password,
            preferences: {
                language: 'pt-PT',
                notifications: true,
                marketing: false,
                theme: 'light'
            }
        };

        const newUser = await registerUser(tempUser, data.password);
        saveUserSession(newUser);
        setCurrentUser(newUser);
        setProjects([]);
        setCurrentRoute(AppRoute.DASHBOARD);
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use' || e.message?.includes('email-already-in-use')) {
            alert("Este e-mail já está registado. Redirecionando para o login...");
            setPrefillEmail(data.email);
            setCurrentRoute(AppRoute.LOGIN);
            return;
        } 
        console.error("Erro no registo:", e);
        alert("Erro ao criar conta: " + (e.message || "Tente novamente."));
    }
  };

  const handleCreateProject = async (details: ProjectDetailsType & { title: string, address: string }) => {
    if (!currentUser) {
        alert("Erro: Utilizador não autenticado.");
        return;
    }
    
    // Limpeza de dados para evitar undefined no Firebase
    const cleanDetails = {
        rooms: details.rooms || 0,
        area: details.area || 0,
        price: details.price || 0,
        bathrooms: details.bathrooms || 0,
        description: details.description || ''
    };

    const newProject: Project = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title: details.title || 'Novo Projeto',
      address: details.address || '',
      details: cleanDetails,
      status: 'In Progress',
      photos: [],
      createdAt: Date.now(),
      coverImage: ''
    };

    try {
      console.log("Criando projeto:", newProject);
      const savedProject = await saveProject(newProject); 
      setProjects([savedProject, ...projects]);
      setActiveProject(savedProject);
      setCurrentRoute(AppRoute.PROJECT_DETAILS);
      setIsNewProjectModalOpen(false);
      console.log("Projeto criado com sucesso!");
    } catch (e: any) {
      console.error("ERRO AO CRIAR PROJETO:", e);
      alert(`Erro ao criar projeto: ${e.message}`);
    }
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
    }

    console.log("📸 Iniciando salvamento da foto...");
    console.log("Dados da foto:", photo);

    try {
      // 1. Se não houver projeto ativo, criar um rascunho
      if (!activeProject) {
          console.log("⚠️ Nenhum projeto ativo. Criando rascunho...");
          const draftId = crypto.randomUUID();
          const draft: Project = {
              id: draftId,
              userId: currentUser.id,
              title: 'Rascunho ' + new Date().toLocaleTimeString(),
              address: 'Localização não definida',
              status: 'In Progress',
              photos: [photo], // Adiciona a foto diretamente
              createdAt: Date.now(),
              coverImage: photo.url
          };
          
          // Tenta salvar no Firestore
          const savedDraft = await saveProject(draft); 
          console.log("✅ Projeto Rascunho salvo no DB:", savedDraft.id);
          
          // Atualiza estado local
          setProjects([savedDraft, ...projects]);
          setActiveProject(savedDraft);
          return;
      }

      // 2. Adicionar ao projeto existente
      console.log("📂 Adicionando ao projeto existente:", activeProject.id);
      
      // Cria uma cópia limpa do projeto atualizado
      const updatedPhotos = [...(activeProject.photos || []), photo];
      const updatedProject = {
          ...activeProject,
          photos: updatedPhotos,
          // Se não tiver capa, define esta foto como capa
          coverImage: activeProject.coverImage || photo.url 
      };

      // Atualiza UI imediatamente (Optimistic Update)
      setActiveProject(updatedProject);
      
      // Atualiza lista geral
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));

      // Salva no DB
      await saveProject(updatedProject);
      console.log("✅ Foto salva no projeto com sucesso!");

      // (Opcional) Gera descrição em background
      generateDescription(photo.url).then((desc) => {
          console.log("Descrição IA gerada:", desc);
      }).catch(() => {}); // Ignora erro de IA silenciosamente

    } catch (e: any) {
      console.error("❌ ERRO CRÍTICO AO SALVAR:", e);
      
      // Feedback visível ao usuário
      if (e.code === 'permission-denied') {
          alert("Erro de Permissão: O banco de dados recusou a gravação.");
      } else if (e.code === 'storage/quota-exceeded') {
          alert("Erro: Espaço de armazenamento cheio.");
      } else {
          alert(`Falha ao salvar foto: ${e.message || e}`);
      }
    }
  };

  const handleSaveEditedPhoto = async (updatedPhoto: Photo) => {
      if (!activeProject) return;
      try {
        const updatedPhotos = activeProject.photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p);
        const updatedProject = { ...activeProject, photos: updatedPhotos, coverImage: updatedPhotos[0].url };
        const savedProject = await saveProject(updatedProject);
        setProjects(projects.map(p => p.id === activeProject.id ? savedProject : p));
        setActiveProject(savedProject);
        setCurrentRoute(AppRoute.PROJECT_DETAILS);
      } catch (e) { alert("Erro ao guardar alterações."); }
  };

  const handleUpdateProject = async (updated: Project) => {
      try {
        const savedProject = await saveProject(updated);
        setProjects(projects.map(p => p.id === updated.id ? savedProject : p));
        setActiveProject(savedProject);
      } catch (e) { alert("Erro ao atualizar projeto."); }
  };

  const handleLoginSubmit = async (email: string, password?: string) => {
      try {
          const user = await loginUser(email, password);
          saveUserSession(user);
          setCurrentUser(user);
          const userProjects = await getUserProjects(user.id);
          setProjects(userProjects);
          setCurrentRoute(AppRoute.DASHBOARD);
      } catch (e: any) { 
          console.error("Login error:", e);
          alert("Login falhou: " + (e.message || "Verifique suas credenciais.")); 
      }
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
      try {
          const savedUser = await updateUser(updatedUser);
          saveUserSession(savedUser);
          setCurrentUser(savedUser);
      } catch (e) { alert("Erro ao atualizar perfil."); }
  };

  const handleDeleteAccount = async () => {
      if (currentUser) {
          try {
              await deleteUserAccount(currentUser.email, currentUser.id);
              await handleLogout();
          } catch(e) { alert("Erro ao apagar conta."); }
      }
  };

  const handleLogout = async () => { await logoutUser(); setCurrentUser(null); setCurrentRoute(AppRoute.LANDING); };

  const handleCentralCameraAction = () => {
      if (currentRoute === AppRoute.PROJECT_DETAILS && activeProject) {
          setCurrentRoute(AppRoute.CAMERA);
      } else {
          setIsNewProjectModalOpen(true);
      }
  };

  const isAuthRoute = [AppRoute.LANDING, AppRoute.WELCOME, AppRoute.REGISTER, AppRoute.LOGIN].includes(currentRoute);
  const isFullScreenTool = [AppRoute.CAMERA, AppRoute.TOUR_VIEWER, AppRoute.EDITOR, AppRoute.MENU].includes(currentRoute);
  
  const header = null;

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LANDING: return <LandingScreen onLogin={() => setCurrentRoute(AppRoute.LOGIN)} onFreeTrial={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.LOGIN: return <LoginScreen initialEmail={prefillEmail} onLogin={handleLoginSubmit} onBack={() => setCurrentRoute(AppRoute.LANDING)} onRegisterClick={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.WELCOME: return <WelcomeScreen onNext={handleRoleSelect} onBack={() => setCurrentRoute(AppRoute.LANDING)} />;
      case AppRoute.REGISTER: return <RegisterScreen role={selectedRole} onSubmit={handleRegistrationSubmit} onBack={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.CAMERA:
        return <CameraView onClose={() => setCurrentRoute(activeProject ? AppRoute.PROJECT_DETAILS : AppRoute.DASHBOARD)} onPhotoCaptured={handlePhotoCaptured} />;
      case AppRoute.EDITOR:
        return activePhoto ? <Editor photo={activePhoto} onSave={handleSaveEditedPhoto} onCancel={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)} /> : <div>Erro: Nenhuma foto</div>;
      
      case AppRoute.PROJECT_DETAILS:
        if (!activeProject) return <div>Carregando...</div>;
        return (
            <ProjectDetail 
                initialProject={activeProject} 
                onBack={() => setCurrentRoute(AppRoute.DASHBOARD)} 
                onAddPhoto={() => setCurrentRoute(AppRoute.CAMERA)} 
                onEditPhoto={(p) => { setActivePhoto(p); setCurrentRoute(AppRoute.EDITOR); }} 
                onUpdateProject={handleUpdateProject} 
                onViewTour={() => setCurrentRoute(AppRoute.TOUR_VIEWER)} 
            />
        );

      case AppRoute.TOUR_VIEWER:
         return activeProject ? <TourViewer project={activeProject} onClose={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)} /> : null;

      case AppRoute.SETTINGS:
          return <SettingsScreen 
                    currentUser={currentUser} 
                    onUpdateUser={handleUpdateUser} 
                    onDeleteAccount={handleDeleteAccount} 
                 />;

      case AppRoute.MENU:
          return <ManagementMenu onClose={() => setCurrentRoute(AppRoute.DASHBOARD)} onNavigate={(r: string) => r === 'SETTINGS' ? setCurrentRoute(AppRoute.SETTINGS) : setCurrentRoute(AppRoute.DASHBOARD)} onLogout={handleLogout} />;

      case AppRoute.DASHBOARD:
      default:
        return (
          <>
            <ProjectList 
                projects={projects} 
                onSelectProject={(p) => { setActiveProject(p); setCurrentRoute(AppRoute.PROJECT_DETAILS); }} 
                onCreateProject={() => setIsNewProjectModalOpen(true)} 
                onDeleteProject={async (id) => { await deleteProject(id); setProjects(prev => prev.filter(p => p.id !== id)); }} 
            />
            {isNewProjectModalOpen && <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} />}
          </>
        );
    }
  };

  return (
    <HashRouter>
      <UpdateNotification />
      {(isAuthRoute || isFullScreenTool) ? (
          <div className="h-screen w-full bg-black overflow-hidden">{renderContent()}</div>
      ) : (
          <MainLayout 
             currentRoute={currentRoute} 
             onNavigate={setCurrentRoute} 
             onLogout={handleLogout}
             onCameraAction={handleCentralCameraAction} 
             headerComponent={header}
          >
             {renderContent()}
          </MainLayout>
      )}
    </HashRouter>
  );
}
export default App;
