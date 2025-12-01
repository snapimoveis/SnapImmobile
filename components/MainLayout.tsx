import React from 'react';
import { Home, Settings, Camera, LogOut, ArrowLeft, Plus } from 'lucide-react';
import { AppRoute } from '../types';

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
  headerComponent
}) => {

  const isDashboard = currentRoute === AppRoute.DASHBOARD;
  const isSettings = currentRoute === AppRoute.SETTINGS;

  // Função para decidir o que fazer ao clicar em "Voltar" ou "Logo"
  const handleLeftIconClick = () => {
    if (!isDashboard) {
      onNavigate(AppRoute.DASHBOARD);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen-safe w-full bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      {/* === SIDEBAR (Desktop - Mantida igual) === */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-white/5 h-full shrink-0 z-30 transition-colors duration-300">
        <div className="p-8 flex items-center gap-3">
          <img 
            src="/brand/logo_color.png" 
            alt="Snap Immobile" 
            className="h-10 w-auto object-contain dark:hidden" 
          />
          <img 
            src="/brand/logo_color.png" 
            alt="Snap Immobile" 
            className="h-10 w-auto object-contain hidden dark:block brightness-0 invert" 
          />
        </div>

        <nav className="flex-1 px-6 py-4 flex flex-col gap-3">
          <button
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm
              ${currentRoute === AppRoute.DASHBOARD 
                ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-brand-purple'
              }`}
          >
            <Home size={20} />
            <span>Início</span>
          </button>

          <button
            onClick={() => onNavigate(AppRoute.SETTINGS)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm
              ${currentRoute === AppRoute.SETTINGS 
                ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-brand-purple'
              }`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
          
          <button 
            onClick={onCameraAction}
            className="mt-6 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white transition-all shadow-lg shadow-brand-orange/20 font-bold text-sm active:scale-95"
          >
            <Camera size={18} />
            <span>Novo Imóvel</span>
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-gray-100 dark:border-white/5">
           <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 transition-colors text-sm font-medium">
              <LogOut size={18} />
              <span>Sair da conta</span>
           </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL (Mobile + Conteúdo Desktop) === */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        {/* HEADER MOBILE (Fixo no topo) */}
        <div className="md:hidden shrink-0 z-20 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-white/5 px-4 py-3 flex justify-between items-center shadow-sm h-16">
            
            {/* Lado Esquerdo: Seta de Voltar (se não for home) ou Logo */}
            <button 
                onClick={handleLeftIconClick} 
                className="p-2 -ml-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
               {!isDashboard ? (
                   <ArrowLeft size={24} />
               ) : (
                   // Se for Dashboard, mostramos o logo (ou o ícone da marca)
                   <div className="flex items-center gap-2">
                       <img src="/brand/logo_color.png" className="h-8 w-auto dark:hidden" alt="Logo" />
                       <img src="/brand/logo_color.png" className="h-8 w-auto hidden dark:block brightness-0 invert" alt="Logo" />
                   </div>
               )}
            </button>

            {/* Título Central (Opcional ou dinâmico) */}
            {/* <span className="font-bold text-sm tracking-wide uppercase text-gray-500">
                {isDashboard ? 'Meus Imóveis' : isSettings ? 'Ajustes' : ''}
            </span> */}

            {/* Lado Direito: Configurações */}
            <button 
                onClick={() => onNavigate(AppRoute.SETTINGS)} 
                className={`p-2 -mr-2 rounded-full transition-colors ${isSettings ? 'text-brand-purple bg-brand-purple/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
            >
                <Settings size={24} />
            </button>
        </div>

        {/* Conteúdo com Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 w-full bg-brand-gray-50 dark:bg-black">
            <div className="max-w-full mx-auto w-full h-full pb-24 relative"> 
                {children}
            </div>
        </main>

        {/* BOTÃO FLUTUANTE 'NOVO IMÓVEL' (Apenas Mobile) */}
        {/* Posicionado no centro inferior, como na referência */}
        {isDashboard && (
            <div className="md:hidden fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-auto">
                <button 
                    onClick={onCameraAction}
                    className="flex items-center gap-2 bg-brand-purple text-white px-6 py-3.5 rounded-full shadow-xl shadow-brand-purple/30 active:scale-95 transition-transform border border-white/10"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span className="font-bold text-sm tracking-wide">Novo imóvel</span>
                </button>
            </div>
        )}

      </div>
    </div>
  );
};
