import React from "react";
import { AppRoute, Project, UserProfile } from "../types";
import ProjectList from "./ProjectList";

interface MainLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentRoute,
  currentUser,
  onLogout,
  onSelectProject,
  onCreateProject,
  projects,
  children,
}) => {

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const logo = prefersDark
    ? "/static/brand/logo_branco.png"
    : "/static/brand/logo_color.png";

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black transition-colors">

      {/* SIDEBAR – desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 p-6">
        <img src={logo} className="h-10 mb-6" />

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
          Olá, <b>{currentUser.firstName}</b>
        </p>

        <button
          onClick={onCreateProject}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl mb-6 transition w-full"
        >
          + Novo Imóvel
        </button>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-gray-100 dark:bg-neutral-800 cursor-pointer"
              onClick={() => onSelectProject(p)}
            >
              <div className="font-bold text-gray-900 dark:text-white">
                {p.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {p.photos.length} fotos
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="mt-6 text-red-500 underline text-sm"
        >
          Terminar Sessão
        </button>
      </aside>

      {/* MOBILE LIST VIEW */}
      {currentRoute === AppRoute.DASHBOARD && (
        <div className="lg:hidden w-full h-full overflow-y-auto pt-16">
          <ProjectList
            projects={projects}
            onCreateProject={onCreateProject}
            onSelectProject={onSelectProject}
          />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        {children}
      </main>

    </div>
  );
};
