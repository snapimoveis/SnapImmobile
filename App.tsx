import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
// IMPORTANTE: Verifique se esses componentes existem e estão exportados corretamente
import { ProjectList } from './components/ProjectList';
import { CameraView } from './components/CameraView';
import { Editor } from './components/Editor';
import ProjectDetail from './components/ProjectDetail'; 
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

// IMPORTANTE: Verifique se o arquivo types.ts está em src/types.ts e exporta tudo corretamente
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
          const userProjects = await getUserProjects(user.id);
          setProjects(userProjects);
          setCurrentRoute(AppRoute.DASHBOARD);
        } catch (e) {
          console.error("Failed to load projects", e);
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
    if (!currentUser) return;
    
    // GARANTIA: Nenhum campo undefined
    const newProject: Project = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title: details.title || 'Sem título',
      address: details.address || '',
      details: { ...details },
      status: 'In Progress',
      photos: [],
      createdAt: Date.now(),
      coverImage: ''
    };
    
    try {
      const savedProject = await saveProject(newProject); 
      setProjects([savedProject, ...projects]);
      setActiveProject(savedProject);
      setCurrentRoute(AppRoute.PROJECT_DETAILS);
      setIsNewProjectModalOpen(false);
    } catch (e: any) {
      console.error("ERRO AO CRIAR PROJETO:", e);
      if (e.code === 'permission-denied') {
          alert("Permissão negada pelo Firebase.");
      } else {
          alert(`Erro ao criar projeto: ${e.message || e}`);
      }
    }
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser) {
        alert("Sessão expirada. Faça login novamente.");
        return;
    }

    if (!photo || !photo.url) {
        alert("Erro: Foto inválida.");
        return;
    }

    console.log("📸 Processando foto...", photo.id);

    try {
      // Caso 1: Rascunho (Se não houver projeto ativo)
      if (!activeProject) {
          const draft: Project = {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              title: 'Rascunho ' + new Date().toLocaleTimeString(),
              address: 'Localização não definida',
              status: 'In Progress',
              photos: [photo],
              createdAt: Date.now(),
              coverImage: photo.url
          };
          
          const savedDraft = await saveProject(draft); 
          setProjects([savedDraft, ...projects]);
          setActiveProject(savedDraft);
          return;
      }

      // Caso 2: Adicionar ao projeto existente
      // GARANTIA: Array seguro, evitando erro com undefined
      const currentPhotos = Array.isArray(activeProject.photos) ? activeProject.photos : [];
      const updatedPhotos = [...currentPhotos, photo];
      
      const updatedProject = {
          ...activeProject,
          photos: updatedPhotos,
          coverImage: activeProject.coverImage || photo.url 
      };

      // Atualiza UI
      setActiveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));

      // Salva no DB
      await saveProject(updatedProject);
      console.log("✅ Foto salva!");

      // Descrição IA em background
      generateDescription(photo.url).then((desc) => {
          console.log("IA:", desc);
      }).catch(() => {});

    } catch (e: any) {
      console.error("❌ ERRO AO SALVAR:", e);
      // Mostra alerta visual para debug
      alert(`Erro ao salvar: ${e.message || JSON.stringify(e)}`);
    }
  };

  const handleSaveEditedPhoto = async (updatedPhoto: Photo) => {
      if (!activeProject) return;
      try {
        const currentPhotos = Array.isArray(activeProject.photos) ? activeProject.photos : [];
        const updatedPhotos = currentPhotos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p);
        const updatedProject = { ...activeProject, photos: updatedPhotos, coverImage: updatedPhotos[0]?.url || '' };
        
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
                onEditPhoto={(p: Photo) => { setActivePhoto(p); setCurrentRoute(AppRoute.EDITOR); }} 
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
                onSelectProject={(p: Project) => { setActiveProject(p); setCurrentRoute(AppRoute.PROJECT_DETAILS); }} 
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
