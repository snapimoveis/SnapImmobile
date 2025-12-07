
import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { AppRoute } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate, title }) => {
  const isDashboard = currentRoute === AppRoute.DASHBOARD;

  return (
    <header className="bg-gray-900 border-b border-white/5 sticky top-0 z-30 h-16 flex items-center px-4 justify-between shadow-sm">
      <div className="flex items-center gap-3">
        
        {/* Settings Button (Replaces Hamburger on Left) */}
        {isDashboard ? (
             <button 
             onClick={() => onNavigate(AppRoute.MENU)}
             className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
           >
             <Settings className="w-6 h-6" />
           </button>
        ) : (
           <button 
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* Mobile Logo (Hidden on md because Sidebar has it) */}
        <div className="flex items-center gap-3 md:hidden">
          {!isDashboard && <Logo variant="default" className="w-10 h-10" />}
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight hidden sm:block md:ml-2">
            {title || ''}
        </h1>
      </div>

      <div className="flex gap-2">
        {/* "Nova Captura" Button Removed as requested */}
      </div>
    </header>
  );
};
