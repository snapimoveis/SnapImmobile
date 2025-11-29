import React from 'react';
import { Home, Settings, Camera, LogOut } from 'lucide-react';
import { AppRoute } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
  headerComponent?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentRoute, 
  onNavigate, 
  onLogout,
  headerComponent
}) => {

  const navItems = [
    { 
      id: AppRoute.DASHBOARD, 
      icon: Home, 
      label: 'Início',
      isActive: currentRoute === AppRoute.DASHBOARD || currentRoute === AppRoute.PROJECT_DETAILS 
    },
    { 
      id: AppRoute.CAMERA, 
      icon: Camera, 
      label: 'Novo',
      isAction: true 
    },
    { 
      id: AppRoute.SETTINGS, 
      icon: Settings, 
      label: 'Ajustes',
      isActive: currentRoute === AppRoute.SETTINGS
    },
  ];

  return (
    // DARK MODE: bg-gray-900 e text-white
    <div className="flex flex-col md:flex-row h-screen-safe w-full bg-gray-900 text-white overflow-hidden">
      
      {/* === SIDEBAR (Desktop) === */}
      <aside className="hidden md:flex flex-col w-64 bg-black border-r border-white/10 h-full shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(250,204,21,0.2)]">S</div>
          <span className="font-bold text-xl tracking-tight text-white">SnapImmobile</span>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
          {navItems.filter(i => !i.isAction).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                ${item.isActive 
                  ? 'bg-yellow-400 text-black font-bold shadow-lg shadow-yellow-400/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          
          <button 
            onClick={() => onNavigate(AppRoute.CAMERA)}
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-colors shadow-lg"
          >
            <Camera size={20} className="text-yellow-400" />
            <span>Novo Imóvel</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 mt-auto">
           <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
              <LogOut size={20} />
              <span>Sair</span>
           </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL === */}
      <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
        
        {/* Header Transparente */}
        {headerComponent && (
            <div className="shrink-0 z-10 bg-gray-900/80 backdrop-blur-md sticky top-0 md:relative border-b border-white/5">
                {headerComponent}
            </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8 w-full bg-gray-900">
            <div className="max-w-7xl mx-auto w-full">
                {children}
            </div>
        </main>

        {/* === BOTTOM BAR (Mobile) === */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-50">
            <div className="flex items-center justify-around h-16 px-2">
                <button 
                    onClick={() => onNavigate(AppRoute.DASHBOARD)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.DASHBOARD ? 'text-yellow-400' : 'text-gray-500'}`}
                >
                    <Home size={24} strokeWidth={currentRoute === AppRoute.DASHBOARD ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">Início</span>
                </button>

                <div className="relative -top-6">
                    <button 
                        onClick={() => onNavigate(AppRoute.CAMERA)}
                        className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-95 transition-transform border-4 border-gray-900"
                    >
                        <Camera size={26} className="text-black" />
                    </button>
                </div>

                <button 
                    onClick={() => onNavigate(AppRoute.SETTINGS)}
                    className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${currentRoute === AppRoute.SETTINGS ? 'text-yellow-400' : 'text-gray-500'}`}
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
