
import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Header } from './components/Header';
import { ProjectList } from './components/ProjectList';
import { CameraView } from './components/CameraView';
import { Editor } from './components/Editor';
import { ProjectDetail } from './components/ProjectDetail';
import { TourViewer } from './components/TourViewer';
import { NewProjectModal } from './components/NewProjectModal';
import { LandingScreen } from './components/LandingScreen';
import { NavigationMenu } from './components/NavigationMenu';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { LoginScreen } from './components/LoginScreen';
import { ManagementMenu } from './components/ManagementMenu';
import { AppRoute, Project, Photo, ProjectDetails, UserProfile } from './types';
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
        // Tratamento robusto de erros do Firebase
        if (e.code === 'auth/email-already-in-use' || e.message?.includes('email-already-in-use')) {
            alert("Este e-mail já está registado. Redirecionando para o login...");
            setPrefillEmail(data.email);
            setCurrentRoute(AppRoute.LOGIN);
            return;
        } 
        
        console.error("Erro no registo:", e);
        
        if (e.code === 'auth/weak-password') {
            alert("A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.");
        } else if (e.code === 'auth/invalid-email') {
            alert("O formato do e-mail é inválido.");
        } else if (e.code === 'auth/network-request-failed') {
            alert("Falha na conexão. Verifique a sua internet.");
        } else {
            alert("Erro ao criar conta: " + (e.message || "Tente novamente."));
        }
    }
  };

  const handleCreateProject = async (details: ProjectDetails & { title: string, address: string }) => {
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
      const msg = e.code === 'permission-denied' ? 'Permissão negada. Verifique as Regras no Console do Firebase.' : 'Erro ao criar projeto.';
      alert(msg);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm("Tem a certeza que deseja eliminar este imóvel?")) {
      try {
        await deleteProject(projectId);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (activeProject && activeProject.id === projectId) setActiveProject(null);
      } catch (e) {
        alert("Erro ao eliminar projeto.");
      }
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
          setCurrentRoute(AppRoute.PROJECT_DETAILS); // Changed from EDITOR to PROJECT_DETAILS
          return;
      }

      // If activeProject already exists, generate description and add photo
      const description = await generateDescription(photo.url);
      const photoWithDesc = { ...photo, description };
      const updatedProject = {
          ...activeProject,
          photos: [...activeProject.photos, photoWithDesc],
          coverImage: activeProject.coverImage || photo.url
      };

      // SAVE and UPDATE STATE with the returned lightweight object (Cloud URLs)
      // This prevents the "Quota Exceeded" / "Error Saving" on 2nd photo
      const savedProject = await saveProject(updatedProject); 
      
      const updatedProjects = projects.map(p => p.id === activeProject.id ? savedProject : p);
      setProjects(updatedProjects);
      setActiveProject(savedProject); // Important: Update local state to use Cloud URL
      setCurrentRoute(AppRoute.PROJECT_DETAILS); // Changed from EDITOR to PROJECT_DETAILS
    } catch (e: any) {
      console.error(e);
      const msg = e.code === 'storage/unauthorized' 
        ? 'Permissão de Upload negada. Corrija as "Storage Rules" no Firebase.' 
        : `Erro ao guardar a foto: ${e.message}`;
      alert(msg);
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
      } catch (e) {
        alert("Erro ao guardar alterações.");
      }
  };

  const navigateToProject = (project: Project) => {
      setActiveProject(project);
      setCurrentRoute(AppRoute.PROJECT_DETAILS);
  };

  const handleUpdateProject = async (updated: Project) => {
      try {
        const savedProject = await saveProject(updated);
        setProjects(projects.map(p => p.id === updated.id ? savedProject : p));
        setActiveProject(savedProject);
      } catch (e) {
        alert("Erro ao atualizar projeto.");
      }
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
          console.error("Erro no login:", e);
          let msg = "Falha no login.";
          
          if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
              msg = "E-mail ou senha incorretos.";
          } else if (e.code === 'auth/too-many-requests') {
              msg = "Muitas tentativas falhadas. Tente novamente mais tarde.";
          } else if (e.message && e.message.includes('DEVICE_NOT_ALLOWED')) {
              msg = "Acesso bloqueado: Esta conta está vinculada a outro dispositivo por segurança.";
          } else if (e.message) {
              msg = e.message;
          }
          alert(msg);
      }
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
      try {
          const savedUser = await updateUser(updatedUser);
          saveUserSession(savedUser);
          setCurrentUser(savedUser);
      } catch (e) {
          alert("Erro ao atualizar perfil.");
      }
  };

  const handleDeleteAccount = async () => {
      if (currentUser) {
          try {
              await deleteUserAccount(currentUser.email, currentUser.id);
              await handleLogout();
          } catch(e) {
              alert("Erro ao apagar conta.");
          }
      }
  };

  const handleLogout = async () => {
      await logoutUser();
      setCurrentUser(null);
      setCurrentRoute(AppRoute.LANDING);
  };

  const isAuthRoute = [AppRoute.LANDING, AppRoute.WELCOME, AppRoute.REGISTER, AppRoute.LOGIN].includes(currentRoute);
  const isFullScreenTool = [AppRoute.CAMERA, AppRoute.TOUR_VIEWER, AppRoute.EDITOR, AppRoute.MENU].includes(currentRoute);
  const showSidebar = !isAuthRoute && !isFullScreenTool;

  const renderContent = () => {
    switch (currentRoute) {
      case AppRoute.LANDING:
        return <LandingScreen onLogin={() => setCurrentRoute(AppRoute.LOGIN)} onFreeTrial={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.LOGIN:
        return <LoginScreen initialEmail={prefillEmail} onLogin={handleLoginSubmit} onBack={() => setCurrentRoute(AppRoute.LANDING)} onRegisterClick={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.WELCOME:
        return <WelcomeScreen onNext={handleRoleSelect} onBack={() => setCurrentRoute(AppRoute.LANDING)} />;
      case AppRoute.REGISTER:
        return <RegisterScreen role={selectedRole} onSubmit={handleRegistrationSubmit} onBack={() => setCurrentRoute(AppRoute.WELCOME)} />;
      case AppRoute.CAMERA:
        return <CameraView onClose={() => setCurrentRoute(activeProject ? AppRoute.PROJECT_DETAILS : AppRoute.DASHBOARD)} onPhotoCaptured={handlePhotoCaptured} />;
      case AppRoute.EDITOR:
        return activePhoto ? <Editor photo={activePhoto} onSave={handleSaveEditedPhoto} onCancel={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)} /> : <div>Erro: Nenhuma foto</div>;
      case AppRoute.PROJECT_DETAILS:
        return activeProject ? <ProjectDetail project={activeProject} onBack={() => setCurrentRoute(AppRoute.DASHBOARD)} onAddPhoto={() => setCurrentRoute(AppRoute.CAMERA)} onEditPhoto={(p) => { setActivePhoto(p); setCurrentRoute(AppRoute.EDITOR); }} onUpdateProject={handleUpdateProject} onViewTour={() => setCurrentRoute(AppRoute.TOUR_VIEWER)} /> : <div>Erro: Nenhum projeto</div>;
      case AppRoute.TOUR_VIEWER:
         return activeProject ? <TourViewer project={activeProject} onClose={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)} /> : null;
      case AppRoute.SETTINGS:
          return <SettingsScreen currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteAccount={handleDeleteAccount} />;
      case AppRoute.MENU:
          return <ManagementMenu onClose={() => setCurrentRoute(AppRoute.DASHBOARD)} onNavigate={(r) => r === 'SETTINGS' ? setCurrentRoute(AppRoute.SETTINGS) : setCurrentRoute(AppRoute.DASHBOARD)} onLogout={handleLogout} />;
      case AppRoute.DASHBOARD:
      default:
        return (
          <>
            <ProjectList projects={projects} onSelectProject={navigateToProject} onCreateProject={() => setIsNewProjectModalOpen(true)} onDeleteProject={handleDeleteProject} />
            {isNewProjectModalOpen && <NewProjectModal onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} />}
          </>
        );
    }
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
        {showSidebar && <div className="hidden md:block"><NavigationMenu currentRoute={currentRoute} onNavigate={setCurrentRoute} onLogout={handleLogout} /></div>}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {!isAuthRoute && !isFullScreenTool && <Header currentRoute={currentRoute} onNavigate={setCurrentRoute} title={activeProject && currentRoute === AppRoute.PROJECT_DETAILS ? activeProject.title : undefined} />}
            <main className={`flex-1 overflow-y-auto ${!isAuthRoute && !isFullScreenTool ? 'pt-0' : ''}`}>{renderContent()}</main>
        </div>
      </div>
    </HashRouter>
  );
}
export default App;
