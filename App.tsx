import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { ProjectList } from './components/ProjectList';
import { CameraView } from './components/CameraView';
import { Editor } from './components/Editor';
// Importação direta do export default e nomeado
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

// Importações de Tipos
import { AppRoute, Project, Photo, ProjectDetails as ProjectDetailsType, UserProfile } from './types';
// Importações de Serviços
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
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title: details.title,
      address: details.address,
      details: { ...details },
      status: 'In Progress',
      photos: [],
      createdAt: Date.now()
    };
    
    try {
      const savedProject = await saveProject(newProject); 
      setProjects([savedProject, ...projects]);
      setActiveProject(savedProject);
      setCurrentRoute(AppRoute.PROJECT_DETAILS);
      setIsNewProjectModalOpen(false);
    } catch (e: any) {
      console.error("ERRO AO CRIAR PROJETO:", e);
      alert('Erro ao criar projeto.'); 
    }
  };

  const handlePhotoCaptured = async (photo: Photo) => {
    if (!currentUser) return;
    try {
      if (!activeProject) {
          const draft: Project = {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              title: 'Imóvel Rascunho',
              address: 'Sem Morada',
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
      
      // Chama a IA, mas trata o erro silenciosamente para não parar o fluxo
      generateDescription(photo.url)
        .then((desc: string) => console.log("Descrição gerada:", desc))
        .catch((err: any) => console.warn("Erro IA:", err));

      const updatedProject = {
          ...activeProject,
          photos: [...activeProject.photos, photo],
          coverImage: activeProject.coverImage || photo.url
      };
      
      setActiveProject(updatedProject);
      
      saveProject(updatedProject).then((saved: Project) => {
          setProjects(prev => prev.map(p => p.id === activeProject.id ? saved : p));
      });
    } catch (e: any) { alert(`Erro: ${e.message}`); }
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
        console.error(e); 
        alert("Login falhou."); 
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
                // Tipagem explicita
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
                // Tipagem explicita
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
