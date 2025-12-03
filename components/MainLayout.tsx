import React from "react";
import { AppRoute, Project, UserProfile } from "../types";

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
  onNavigate,
  currentUser,
  onLogout,
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  children,
}) => {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const logo = prefersDark
    ? "/static/brand/logo_branca.png"
    : "/static/brand/logo_color.png";

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black transition-colors">

      {/* ================================
          SIDEBAR — Desktop
      ================================= */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 p-6 select-none">
        <div className="flex items-center justify-between mb-8">
          <img src={logo} className="h-10" alt="Logo" draggable={false} />
        </div>

        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          Olá, <b>{currentUser.firstName}</b>
        </p>

        <button
          onClick={onCreateProject}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl mb-6 transition w-full shadow-md"
        >
          + Novo Imóvel
        </button>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="p-4 rounded-xl bg-gray-100 dark:bg-neutral-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition shadow-card"
            >
              <div className="font-bold text-gray-900 dark:text-white">
                {p.title || "Sem Título"}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {p.photos?.length} fotos
              </div>

              <button
                className="text-red-500 text-xs mt-2 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(p.id);
                }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onLogout}
          className="mt-8 text-red-500 underline text-sm"
        >
          Terminar Sessão
        </button>
      </aside>

      {/* ================================
          MOBILE HEADER
      ================================= */}
      <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white dark:bg-black px-5 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 z-40">
        <img src={logo} className="h-8" alt="Logo" draggable={false} />

        <button
          onClick={onLogout}
          className="text-sm text-red-500 underline"
        >
          Sair
        </button>
      </header>

      {/* ================================
          MOBILE LISTA DE IMÓVEIS
      ================================= */}
      {currentRoute === AppRoute.DASHBOARD && (
        <div className="lg:hidden pt-20 pb-24 w-full px-5 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Os seus imóveis
          </h2>

          {projects.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-10">
              Ainda não adicionou nenhum imóvel.
            </p>
          )}

          <div className="grid grid-cols-1 gap-5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-gray-100 dark:bg-neutral-800 shadow-card cursor-pointer"
                onClick={() => onSelectProject(p)}
              >
                <div className="font-bold text-gray-900 dark:text-white text-lg">
                  {p.title || "Sem Título"}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {p.photos?.length} fotos
                </div>

                <button
                  className="text-red-500 text-xs mt-2 underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(p.id);
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================
          MAIN CONTENT
      ================================= */}
      <main className="flex-1 overflow-y-auto pt-20 lg:pt-0">
        {children}
      </main>

      {/* ================================
          MOBILE FAB BUTTON (Add Imóvel)
      ================================= */}
      <button
        onClick={onCreateProject}
        className="lg:hidden fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold px-6 py-4 rounded-full shadow-xl active:scale-95 transition z-50"
      >
        + Imóvel
      </button>
    </div>
  );
};
