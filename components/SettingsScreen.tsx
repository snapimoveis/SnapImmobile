import React from "react";
import {
  FileText,
  Shield,
  LogOut,
  Moon,
  ChevronRight,
  User,
} from "lucide-react";
import { UserProfile } from "../types";

export interface SettingsScreenProps {
  currentUser: UserProfile | null;
  onUpdateUser: (user: UserProfile) => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onDeleteAccount,
}) => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="
      min-h-screen 
      bg-brand-gray-50 dark:bg-black 
      text-gray-900 dark:text-white 
      px-4 md:px-8 
      py-8 
      animate-in slide-in-from-right-4 
      max-w-3xl mx-auto
    ">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <img
            src="/brand/logo_color.png"
            className="h-10 dark:hidden"
            alt="Snap Immobile"
          />
          <img
            src="/brand/logo_color.png"
            className="h-10 hidden dark:block brightness-0 invert"
            alt="Snap Immobile"
          />
        </div>

        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition"
        >
          <ChevronRight size={26} className="rotate-180 text-gray-400" />
        </button>
      </div>

      {/* USER CARD */}
      <div className="mb-10">
        <div className="
          bg-white dark:bg-[#121212] 
          border border-gray-200 dark:border-white/5 
          rounded-2xl 
          p-6 
          shadow-sm 
          flex items-center gap-5
        ">
          <div className="
            w-16 h-16 rounded-full overflow-hidden 
            bg-gray-200 dark:bg-white/10 
            flex items-center justify-center
          ">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={30} className="text-gray-600 dark:text-gray-300" />
            )}
          </div>

          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentUser?.firstName} {currentUser?.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="space-y-10">

        {/* PRIVACIDADE */}
        <Section>
          <LinkItem icon={Shield} label="Política de Privacidade" />
          <LinkItem icon={FileText} label="Termos e Condições" />
        </Section>

        {/* TEMA */}
        <Section>
          <ToggleItem 
            label="Modo Escuro" 
            icon={Moon} 
            onClick={toggleTheme} 
          />
        </Section>

        {/* CONTA */}
        <Section>
          <DangerItem 
            label="Eliminar Conta" 
            onClick={onDeleteAccount} 
          />
        </Section>

      </div>

      <div className="h-16" />
    </div>
  );
};

/* ---------------------------------------------------------- */
/* COMPONENTES REUTILIZÁVEIS */
/* ---------------------------------------------------------- */

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="
    bg-white dark:bg-[#121212] 
    border border-gray-200 dar
