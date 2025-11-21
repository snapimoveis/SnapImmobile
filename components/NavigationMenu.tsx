import React, { useState } from 'react';
import { LayoutDashboard, FolderOpen, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { AppRoute } from '../types';
import { Logo } from './Logo';

interface NavigationMenuProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentRoute, onNavigate, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { 
      label: 'Dashboard', 
      route: AppRoute.DASHBOARD, 
      icon: LayoutDashboard 
    },
    { 
      label: 'Projetos', 
      route: AppRoute.DASHBOARD, // Projects are on dashboard in this app structure
      icon: FolderOpen 
    },
    { 
      label: 'Configurações', 
      route: AppRoute.SETTINGS, 
      icon: Settings 
    },
  ];

  return (
    <aside 
      className={`bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100 relative">
        <div className="transform scale-50 origin-center">
            <Logo className={isCollapsed ? "w-16 h-16" : "w-32 h-32"} />
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => {
          // Special check for Projects since it shares Dashboard route in this simplified logic, 
          // but usually would be separate. For now, if route matches, it's active.
          const isActive = currentRoute === item.route && (item.label !== 'Projetos' || currentRoute === AppRoute.DASHBOARD);
          
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-medium shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} />
              
              {!isCollapsed && (
                <span className="text-sm tracking-wide whitespace-nowrap overflow-hidden opacity-100 transition-opacity">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${
                isCollapsed ? 'justify-center' : ''
            }`}
        >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
};