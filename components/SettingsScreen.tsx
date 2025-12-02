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
  onUpdateUser,
  onDeleteAccount,
}) => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 dark:bg-black text-gray-900 dark:text-white px-0 md:px-4 py-8 animate-in slide-in-from-right-4">

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 mb-8">
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
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
        >
          <ChevronRight size={24} className="rotate-180 text-gray-500" />
        </button>
      </div>

      {/* USER SECTION */}
      <div className="px-6 mb-8">
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 flex items-center justify-center">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={28} className="text-gray-600 dark:text-gray-300" />
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

      {/* MAIN LIST */}
      <div className="space-y-6">
        {/* PRIVACY */}
        <Section>
          <LinkItem icon={Shield} label="Política de Privacidade" />
          <LinkItem icon={FileText} label="Termos e Condições" />
        </Section>

        {/* THEME */}
        <Section>
          <ToggleItem label="Modo Escuro" icon={Moon} onClick={toggleTheme} />
        </Section>

        {/* ACCOUNT */}
        <Section>
          <DangerItem label="Eliminar Conta" onClick={onDeleteAccount} />
        </Section>
      </div>

      <div className="h-12" />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENTES REUTILIZÁVEIS */
/* -------------------------------------------------------------------------- */

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white dark:bg-[#121212] border-y border-gray-200 dark:border-white/5 divide-y divide-gray-200 dark:divide-white/5">
    {children}
  </div>
);

const LinkItem = ({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) => (
  <div className="flex items-center justify-between py-4 px-6 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
    <div className="flex items-center gap-4">
      <Icon size={22} className="text-gray-700 dark:text-gray-200" />
      <span className="text-base">{label}</span>
    </div>
    <ChevronRight size={20} className="text-gray-400" />
  </div>
);

const ToggleItem = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center justify-between py-4 px-6 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <Icon size={22} className="text-gray-700 dark:text-gray-200" />
      <span className="text-base">{label}</span>
    </div>

    <div className="w-11 h-6 bg-gray-300 dark:bg-brand-purple rounded-full relative transition">
      <div className="absolute top-1 left-1 w-4 h-4 bg-white dark:bg-black rounded-full shadow transition-transform dark:translate-x-5" />
    </div>
  </div>
);

const DangerItem = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center gap-4 py-4 px-6 hover:bg-red-50 dark:hover:bg-red-700/20 cursor-pointer group transition"
  >
    <LogOut
      size={22}
      className="text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform"
    />
    <span className="text-base text-red-600 dark:text-red-400 font-semibold">
      {label}
    </span>
  </div>
);
