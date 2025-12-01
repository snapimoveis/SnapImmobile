import React from 'react';
import { Home, Settings, Camera, LogOut } from 'lucide-react';
import { AppRoute } from '../types';

interface ShellProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  onCameraAction: () => void;
  headerComponent?: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  currentRoute, 
  onNavigate, 
  onLogout,
  onCameraAction,
  headerComponent
}) => {

  const isProjectActive = currentRoute === AppRoute.PROJECT_DETAILS;

  return (
    <div className="flex flex-col md:flex-row h-screen-safe w-full bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      {/* === SIDEBAR (Desktop) === */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#121212] border-r border-gray-200 dark:border-white/5 h-full shrink-0 z-30 transition-colors duration-300">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-purple/20 text-xl">
            S
          </div>
          <span className="font-bold text-xl tracking-tight text-brand-purple dark:text-white">SnapImmobile</span>
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
            <span>{isProjectActive ? 'Abrir Câmera' : 'Novo Imóvel'}</span>
          </button>
        </nav>

        <div className="p-6 mt-auto">
           <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 transition-colors text-sm font-medium">
              <LogOut size={18} />
              <span>Sair da conta</span>
           </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL === */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        {headerComponent && (
            <div className="shrink-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0 transition-colors duration-300">
                {headerComponent}
            </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 w-full">
            <div className="max-w-full mx-auto w-full h-full">
                {children}
            </div>
        </main>

        {/* === BOTTOM BAR (Mobile) === */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-white/5 pb-[env(safe-area-inset-bottom)] z-50 transition-colors duration-300">
            <div className="flex items-center justify-around h-16 px-2">
                
                <button 
                    onClick={() => onNavigate(AppRoute.DASHBOARD)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.DASHBOARD ? 'text-brand-purple' : 'text-gray-400 dark:text-gray-600'}`}
                >
                    <Home size={24} strokeWidth={currentRoute === AppRoute.DASHBOARD ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>

                <div className="relative -top-6">
                    <button 
                        onClick={onCameraAction}
                        className="w-16 h-16 bg-brand-purple rounded-full flex items-center justify-center shadow-xl shadow-brand-purple/30 active:scale-95 transition-transform border-[4px] border-white dark:border-[#121212]"
                    >
                        <Camera size={28} className="text-white" />
                    </button>
                </div>

                <button 
                    onClick={() => onNavigate(AppRoute.SETTINGS)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.SETTINGS ? 'text-brand-purple' : 'text-gray-400 dark:text-gray-600'}`}
                >
                    <Settings size={24} strokeWidth={currentRoute === AppRoute.SETTINGS ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Ajustes</span>
                </button>

            </div>
        </nav>

      </div>
    </div>
  );
};
