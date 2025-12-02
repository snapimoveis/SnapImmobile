import React, { useState } from "react";
import { 
  Home, Settings, Camera, LogOut, Menu, X, ArrowLeft, Plus 
} from "lucide-react";
import { AppRoute } from "../types";

interface MainLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  onCameraAction: () => void;
  headerComponent?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentRoute,
  onNavigate,
  onLogout,
  onCameraAction,
  headerComponent,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const isDashboard = currentRoute === AppRoute.DASHBOARD;
  const isSettings = currentRoute === AppRoute.SETTINGS;

  const handleLeftIconClick = () => {
    if (!isDashboard) onNavigate(AppRoute.DASHBOARD);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      
      {/* ------------------------------- */}
      {/* SIDEBAR - DESKTOP */}
      {/* ------------------------------- */}
      <aside className="
        hidden md:flex flex-col w-64 bg-white dark:bg-[#121212]
        border-r border-gray-200 dark:border-white/10
        h-full shrink-0 z-30
      ">
        <div className="p-8 flex items-center gap-3">
          <img src="/brand/logo_color.png" className="h-10 dark:hidden" />
          <img src="/brand/logo_color.png" className="h-10 hidden dark:block brightness-0 invert" />
        </div>

        <nav className="flex-1 px-6 py-4 flex flex-col gap-3">
          
          {/* DASHBOARD */}
          <button
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
            className={`nav-item ${currentRoute === AppRoute.DASHBOARD ? "nav-active" : ""}`}
          >
            <Home size={20} />
            Início
          </button>

          {/* CONFIGURAÇÕES */}
          <button
            onClick={() => onNavigate(AppRoute.SETTINGS)}
            className={`nav-item ${currentRoute === AppRoute.SETTINGS ? "nav-active" : ""}`}
          >
            <Settings size={20} />
            Configurações
          </button>

          {/* NOVO IMÓVEL */}
          <button
            onClick={onCameraAction}
            className="mt-6 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl 
            bg-brand-purple text-white font-bold shadow-lg hover:bg-brand-purple/90"
          >
            <Camera size={18} /> Novo Imóvel
          </button>
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-white/10 mt-auto">
          <button 
            onClick={onLogout} 
            className="logout-btn"
          >
            <LogOut size={18} /> Sair da conta
          </button>
        </div>
      </aside>


      {/* ------------------------------- */}
      {/* MENU MOBILE (Drawer) */}
      {/* ------------------------------- */}
      <div
        className={`
          fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm 
          transition-opacity ${menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#121212]
          border-r border-gray-200 dark:border-white/10 z-50 p-6
          transition-transform duration-300
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-6">
          <img src="/brand/logo_color.png" className="h-10 dark:hidden" />
          <img src="/brand/logo_color.png" className="h-10 hidden dark:block brightness-0 invert" />
          <button onClick={() => setMenuOpen(false)}>
            <X size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex flex-col gap-3">

          <button
            onClick={() => { onNavigate(AppRoute.DASHBOARD); setMenuOpen(false); }}
            className={`nav-item ${currentRoute === AppRoute.DASHBOARD ? "nav-active" : ""}`}
          >
            <Home size={20} /> Início
          </button>

          <button
            onClick={() => { onNavigate(AppRoute.SETTINGS); setMenuOpen(false); }}
            className={`nav-item ${currentRoute === AppRoute.SETTINGS ? "nav-active" : ""}`}
          >
            <Settings size={20} /> Configurações
          </button>

          <button
            onClick={() => { onCameraAction(); setMenuOpen(false); }}
            className="mt-4 flex items-center justify-center gap-2 
              px-4 py-3.5 rounded-xl bg-brand-orange text-white font-bold shadow-lg"
          >
            <Camera size={18} /> Novo Imóvel
          </button>
        </div>

        <button onClick={onLogout} className="logout-btn mt-auto">
          <LogOut size={18} /> Sair da conta
        </button>
      </aside>


      {/* ------------------------------- */}
      {/* MAIN CONTENT */}
      {/* ------------------------------- */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">

        {/* HEADER MOBILE */}
        <header className="md:hidden h-16 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-white/10 px-4 flex items-center justify-between">
          <button className="p-2" onClick={handleLeftIconClick}>
            {!isDashboard ? <ArrowLeft size={24} /> : <Menu size={26} onClick={() => setMenuOpen(true)} />}
          </button>

          <img src="/brand/logo_color.png" className="h-8 dark:hidden" />
          <img src="/brand/logo_color.png" className="h-8 hidden dark:block brightness-0 invert" />

          <button onClick={() => onNavigate(AppRoute.SETTINGS)}>
            <Settings size={24} />
          </button>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 py-6">
            {children}
          </div>
        </main>

        {/* BOTÃO FLUTUANTE MOBILE */}
        {isDashboard && (
          <button
            onClick={onCameraAction}
            className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
            bg-brand-purple text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
          >
            <Plus size={20} /> Novo imóvel
          </button>
        )}
      </div>
    </div>
  );
};
