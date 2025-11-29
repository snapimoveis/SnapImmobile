import React from 'react';
import { Home, Settings, Camera, LogOut } from 'lucide-react';
import { AppRoute } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  onCameraAction: () => void;
  headerComponent?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentRoute, 
  onNavigate, 
  onLogout,
  onCameraAction,
  headerComponent
}) => {

  const isProjectActive = currentRoute === AppRoute.PROJECT_DETAILS;

  return (
    // MODO PURO: bg-white (Claro) e bg-black (Escuro)
    <div className="flex flex-col md:flex-row h-screen-safe w-full bg-white dark:bg-black text-black dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      {/* === SIDEBAR (Desktop) === */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-white/10 h-full shrink-0 z-30 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#623aa2] rounded-lg flex items-center justify-center font-bold text-white shadow-md">
            S
          </div>
          <span className="font-bold text-xl tracking-tight">SnapImmobile</span>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          <button
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${currentRoute === AppRoute.DASHBOARD 
                ? 'bg-[#623aa2] text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
          >
            <Home size={20} />
            <span>Início</span>
          </button>

          <button
            onClick={() => onNavigate(AppRoute.SETTINGS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${currentRoute === AppRoute.SETTINGS 
                ? 'bg-[#623aa2] text-white shadow-md' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
          
          <button 
            onClick={onCameraAction}
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-sm group"
          >
            <Camera size={20} className="text-[#623aa2]" />
            <span>{isProjectActive ? 'Abrir Câmera' : 'Novo Imóvel'}</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto">
           <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors">
              <LogOut size={20} />
              <span>Sair</span>
           </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL === */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        {headerComponent && (
            <div className="shrink-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0 transition-colors duration-300">
                {headerComponent}
            </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-0 w-full bg-white dark:bg-black">
            <div className="max-w-7xl mx-auto w-full">
                {children}
            </div>
        </main>

        {/* === BOTTOM BAR (Mobile) === */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)] z-50 transition-colors duration-300">
            <div className="flex items-center justify-around h-16 px-2">
                
                <button 
                    onClick={() => onNavigate(AppRoute.DASHBOARD)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.DASHBOARD ? 'text-[#623aa2]' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Home size={24} strokeWidth={currentRoute === AppRoute.DASHBOARD ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>

                <div className="relative -top-6">
                    <button 
                        onClick={onCameraAction}
                        className="w-16 h-16 bg-[#623aa2] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-[4px] border-white dark:border-black"
                    >
                        <Camera size={28} className="text-white" />
                        {!isProjectActive && (
                           <div className="absolute bottom-3 right-3 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-[#623aa2] font-bold text-[10px] leading-none mb-0.5">+</span>
                           </div>
                        )}
                    </button>
                </div>

                <button 
                    onClick={() => onNavigate(AppRoute.SETTINGS)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.SETTINGS ? 'text-[#623aa2]' : 'text-gray-400 dark:text-gray-500'}`}
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
