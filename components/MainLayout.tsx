// components/MainLayout.tsx

import React from "react";
import { AppRoute, Project, UserProfile } from "../types";

export interface MainLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (r: AppRoute) => void;

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
  return (
    <div className="flex flex-row h-screen w-full bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Snap Immobile</h2>

        <p className="text-sm text-gray-700 mb-6">
          Olá, <b>{currentUser.firstName}</b>
        </p>

        <button
          className="bg-blue-700 text-white p-2 rounded mb-4"
          onClick={onCreateProject}
        >
          + Novo Imóvel
        </button>

        <div className="flex-1 overflow-y-auto">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-3 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => onSelectProject(p)}
            >
              <div className="font-bold">{p.title || "Sem Título"}</div>
              <div className="text-xs text-gray-600">{p.photos?.length} fotos</div>

              <button
                className="text-red-600 text-xs mt-2 underline"
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
          className="mt-4 text-red-600 underline"
          onClick={onLogout}
        >
          Terminar Sessão
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};
