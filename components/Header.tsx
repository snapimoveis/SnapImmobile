import React from 'react';
import { Camera, LayoutGrid, ArrowLeft, Menu } from 'lucide-react';
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 h-16 flex items-center px-4 justify-between shadow-sm">
      <div className="flex items-center gap-3">
        
        {/* Menu Button (Mobile Only - Replaces Back Button on Dashboard) */}
        {isDashboard ? (
             <button 
             onClick={() => onNavigate(AppRoute.MENU)}
             className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
           >
             <Menu className="w-6 h-6 text-gray-700" />
           </button>
        ) : (
           <button 
            onClick={() => onNavigate(AppRoute.DASHBOARD)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {/* Mobile Logo (Hidden on md because Sidebar has it) */}
        <div className="flex items-center gap-3 md:hidden">
          {!isDashboard && <Logo variant="default" className="w-10 h-10" />}
        </div>

        <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block md:ml-2">
            {title || ''}
        </h1>
      </div>

      <div className="flex gap-2">
        {currentRoute !== AppRoute.CAMERA && (
             <button
             onClick={() => onNavigate(AppRoute.CAMERA)}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-md"
           >
             <Camera className="w-4 h-4" />
             <span className="hidden sm:inline">Nova Captura</span>
           </button>
        )}
      </div>
    </header>
  );
};