
import React from 'react';
import { LayoutDashboard, Building2, PieChart, HelpCircle, Mail, ChevronRight } from 'lucide-react';
import { AppRoute } from '../types';
import { Logo } from './Logo';

interface NavigationMenuProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ currentRoute, onNavigate, onLogout }) => {
  
  const mainNavItems = [
    { label: 'Imóveis', route: AppRoute.DASHBOARD, icon: LayoutDashboard },
    { label: 'Empresa', route: AppRoute.SETTINGS, icon: Building2 },
    { label: 'Consumo', route: AppRoute.SETTINGS, icon: PieChart },
  ];

  const bottomNavItems = [
    { label: 'Centro de ajuda', action: () => {}, icon: HelpCircle },
    { label: 'Contacto', action: () => {}, icon: Mail },
  ];

  return (
    <aside className="bg-[#2e0a4d] h-screen sticky top-0 flex flex-col w-64 text-white font-sans z-50">
      {/* Logo Area */}
      <div className="p-6 mb-6">
        <div className="transform scale-75 origin-top-left">
            <Logo variant="white" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {mainNavItems.map((item) => {
          // Active state logic: Dashboard is default active if route matches, OR if route is SETTINGS and label is Empresa
          const isActive = (currentRoute === item.route) && 
                           (item.route !== AppRoute.SETTINGS || (item.label === 'Empresa' && currentRoute === AppRoute.SETTINGS));
          
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={2} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 space-y-1 border-t border-white/10">
        {bottomNavItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all"
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
        ))}
      </div>

      {/* User Profile / Group */}
      <div className="p-4 mt-2 border-t border-white/10">
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                    <div className="text-green-400 font-bold text-xs">IR</div>
                </div>
                <span className="text-sm font-medium group-hover:text-white text-white/90">Grupo</span>
            </div>
            <ChevronRight size={16} className="text-white/50" />
        </button>
      </div>
    </aside>
  );
};
