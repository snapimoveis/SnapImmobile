// ========================================
// App.tsx — versão final corrigida
// ========================================

import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';

import ProjectList from './components/ProjectList';
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

import {
    AppRoute,
    Project,
    Photo,
    ProjectDetails as ProjectDetailsType,
    UserProfile
} from './types';

import {
    getCurrentUser,
    getUserProjects,
    saveProject,
    deleteProject,
    logoutUser,
    registerUser,
    loginUser,
    saveUserSession,
    updateUser,
    deleteUserAccount
} from './services/storage';

import { generateDescription } from './services/geminiService';

// ========================================================================
// APP COMPONENT
// ========================================================================

function App() {
    const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.LANDING);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [prefillEmail, setPrefillEmail] = useState('');

    // DARK MODE AUTO
    useEffect(() => {
        const applyTheme = () => {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle("dark", isDark);
        };
        applyTheme();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    }, []);

    // LOAD USER SESSION
    useEffect(() => {
        const init = async () => {
            const user = getCurrentUser();
            if (user) {
                setCurrentUser(user);
                const userProjects = await getUserProjects(user.id);
                setProjects(userProjects);
                setCurrentRoute(AppRoute.DASHBOARD);
            }
        };
        init();
    }, []);

    // SELECT ROLE
    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        setCurrentRoute(AppRoute.REGISTER);
    };

    // REGISTER USER
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
            if (e.code === "auth/email-already-in-use") {
                alert("Este e-mail já está registado!");
                setPrefillEmail(data.email);
                setCurrentRoute(AppRoute.LOGIN);
                return;
            }
            alert("Erro ao criar a conta.");
        }
    };

    // CREATE PROJECT
    const handleCreateProject = async (details: ProjectDetailsType & { title: string; address: string }) => {
        if (!currentUser) return;

        const newProject: Project = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            title: details.title,
            address: details.address,
            details: { ...details },
            status: 'In Progress',
            photos: [],
            createdAt: Date.now(),
            coverImage: null
        };

        try {
            const saved = await saveProject(newProject);
            setProjects([saved, ...projects]);
            setActiveProject(saved);
            setCurrentRoute(AppRoute.PROJECT_DETAILS);
            setIsNewProjectModalOpen(false);
        } catch {
            alert("Erro ao criar projeto.");
        }
    };

    // SAVE CAPTURED PHOTO
    const handlePhotoCaptured = async (photo: Photo) => {
        if (!currentUser) return;

        try {
            if (!activeProject) {
                const draft: Project = {
                    id: crypto.randomUUID(),
                    userId: currentUser.id,
                    title: "Imóvel Rascunho",
                    address: "Sem Morada",
                    status: "In Progress",
                    photos: [photo],
                    createdAt: Date.now(),
                    coverImage: photo.url
                };

                const savedDraft = await saveProject(draft);
                setProjects([savedDraft, ...projects]);
                setActiveProject(savedDraft);
                return;
            }

            // AI description (fire and forget)
            generateDescription(photo.url).catch(() => {});

            const updated: Project = {
                ...activeProject,
                photos: [...activeProject.photos, photo],
                coverImage: activeProject.coverImage ?? photo.url
            };

            const saved = await saveProject(updated);
            setActiveProject(saved);
            setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));

        } catch {
            alert("Erro ao guardar foto.");
        }
    };

    // SAVE EDITED PHOTO
    const handleSaveEditedPhoto = async (updatedPhoto: Photo) => {
        if (!activeProject) return;

        const newPhotos = activeProject.photos.map(p =>
            p.id === updatedPhoto.id ? updatedPhoto : p
        );

        const updated = {
            ...activeProject,
            photos: newPhotos,
            coverImage: newPhotos[0]?.url ?? activeProject.coverImage ?? ""
        };

        const saved = await saveProject(updated);

        setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));
        setActiveProject(saved);

        setCurrentRoute(AppRoute.PROJECT_DETAILS);
    };

    // UPDATE PROJECT
    const handleUpdateProject = async (updated: Project) => {
        const saved = await saveProject(updated);
        setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));
        setActiveProject(saved);
    };

    // LOGIN
    const handleLoginSubmit = async (email: string = "", password: string = "") => {
        try {
            const user = await loginUser(email, password);
            saveUserSession(user);
            setCurrentUser(user);
            const userProjects = await getUserProjects(user.id);
            setProjects(userProjects);
            setCurrentRoute(AppRoute.DASHBOARD);
        } catch {
            alert("Credenciais inválidas.");
        }
    };

    // UPDATE USER
    const handleUpdateUser = async (updatedUser: UserProfile) => {
        const saved = await updateUser(updatedUser);
        saveUserSession(saved);
        setCurrentUser(saved);
    };

    // DELETE ACCOUNT
    const handleDeleteAccount = async () => {
        if (!currentUser) return;
        await deleteUserAccount(currentUser.email ?? "", currentUser.id);
        await handleLogout();
    };

    // LOGOUT
    const handleLogout = async () => {
        await logoutUser();
        setCurrentUser(null);
        setCurrentRoute(AppRoute.LANDING);
    };

    // CAMERA ACTION
    const handleCentralCameraAction = () => {
        if (currentRoute === AppRoute.PROJECT_DETAILS && activeProject) {
            setCurrentRoute(AppRoute.CAMERA);
        } else {
            setIsNewProjectModalOpen(true);
        }
    };

    const isAuthRoute = [
        AppRoute.LANDING,
        AppRoute.WELCOME,
        AppRoute.REGISTER,
        AppRoute.LOGIN
    ].includes(currentRoute);

    const isFullScreenTool = [
        AppRoute.CAMERA,
        AppRoute.TOUR_VIEWER,
        AppRoute.EDITOR,
        AppRoute.MENU
    ].includes(currentRoute);

    // ROUTER
    const renderContent = () => {
        switch (currentRoute) {
            case AppRoute.LANDING:
                return <LandingScreen
                    onLogin={() => setCurrentRoute(AppRoute.LOGIN)}
                    onFreeTrial={() => setCurrentRoute(AppRoute.WELCOME)}
                />;

            case AppRoute.LOGIN:
                return <LoginScreen
                    initialEmail={prefillEmail}
                    onLogin={handleLoginSubmit}
                    onBack={() => setCurrentRoute(AppRoute.LANDING)}
                    onRegisterClick={() => setCurrentRoute(AppRoute.WELCOME)}
                />;

            case AppRoute.WELCOME:
                return <WelcomeScreen
                    onNext={handleRoleSelect}
                    onBack={() => setCurrentRoute(AppRoute.LANDING)}
                />;

            case AppRoute.REGISTER:
                return <RegisterScreen
                    role={selectedRole}
                    onSubmit={handleRegistrationSubmit}
                    onBack={() => setCurrentRoute(AppRoute.WELCOME)}
                />;

            case AppRoute.CAMERA:
                return <CameraView
                    onClose={() =>
                        setCurrentRoute(activeProject ? AppRoute.PROJECT_DETAILS : AppRoute.DASHBOARD)
                    }
                    onPhotoCaptured={handlePhotoCaptured}
                />;

            case AppRoute.EDITOR:
                return activePhoto
                    ? <Editor
                        photo={activePhoto}
                        onSave={handleSaveEditedPhoto}
                        onCancel={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)}
                    />
                    : <div>Erro: Nenhuma foto carregada.</div>;

            case AppRoute.PROJECT_DETAILS:
                return activeProject ? (
                    <ProjectDetail
                        initialProject={activeProject}
                        onBack={() => setCurrentRoute(AppRoute.DASHBOARD)}
                        onAddPhoto={() => setCurrentRoute(AppRoute.CAMERA)}
                        onEditPhoto={(p) => {
                            setActivePhoto(p);
                            setCurrentRoute(AppRoute.EDITOR);
                        }}
                        onUpdateProject={handleUpdateProject}
                        onViewTour={() => setCurrentRoute(AppRoute.TOUR_VIEWER)}
                    />
                ) : <div>A carregar...</div>;

            case AppRoute.TOUR_VIEWER:
                return activeProject
                    ? <TourViewer project={activeProject} onClose={() => setCurrentRoute(AppRoute.PROJECT_DETAILS)} />
                    : null;

            case AppRoute.SETTINGS:
                return <SettingsScreen
                    currentUser={currentUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteAccount={handleDeleteAccount}
                />;

            case AppRoute.MENU:
                return <ManagementMenu
                    onClose={() => setCurrentRoute(AppRoute.DASHBOARD)}
                    onNavigate={(r: string) => {
                        if (r === 'SETTINGS') setCurrentRoute(AppRoute.SETTINGS);
                        else setCurrentRoute(AppRoute.DASHBOARD);
                    }}
                    onLogout={handleLogout}
                />;

            case AppRoute.DASHBOARD:
            default:
                return (
                    <>
                        <ProjectList
                            projects={projects}
                            onSelectProject={(p) => {
                                setActiveProject(p);
                                setCurrentRoute(AppRoute.PROJECT_DETAILS);
                            }}
                            onCreateProject={() => setIsNewProjectModalOpen(true)}
                            onDeleteProject={async (id) => {
                                await deleteProject(id);
                                setProjects(prev => prev.filter(p => p.id !== id));
                            }}
                        />

                        {isNewProjectModalOpen && (
                            <NewProjectModal
                                onClose={() => setIsNewProjectModalOpen(false)}
                                onCreate={handleCreateProject}
                            />
                        )}
                    </>
                );
        }
    };

    return (
        <HashRouter>
            <UpdateNotification />

            {(isAuthRoute || isFullScreenTool) ? (
                <div className="h-screen w-full bg-black overflow-hidden">
                    {renderContent()}
                </div>
            ) : (
                <MainLayout
                    currentRoute={currentRoute}
                    onNavigate={setCurrentRoute}
                    onLogout={handleLogout}
                    onCameraAction={handleCentralCameraAction}
                    headerComponent={null}
                >
                    {renderContent()}
                </MainLayout>
            )}
        </HashRouter>
    );
}

export default App;
