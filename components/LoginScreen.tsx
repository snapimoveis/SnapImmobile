import React, { useState } from "react";

interface LoginScreenProps {
  error?: string;
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
  onRegisterClick: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  error,
  onLogin,
  onBack,
  onRegisterClick,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Logo automática conforme modo claro/escuro
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const logo = prefersDark
    ? "/static/brand/logo_branca.png"
    : "/static/brand/logo_color.png";

  return (
    <div className="min-h-screen flex flex-col justify-between px-6 py-10 bg-white dark:bg-black transition-colors">

      {/* VOLTAR */}
      <button
        onClick={onBack}
        className="text-gray-600 dark:text-gray-300 text-sm underline mb-4 self-start"
      >
        Voltar
      </button>

      {/* LOGO */}
      <div className="flex justify-center mt-4">
        <img
          src={logo}
          className="w-36 select-none"
          draggable={false}
          alt="Snap Immobile"
        />
      </div>

      {/* TÍTULO */}
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Iniciar sessão
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-3">
          Entre para continuar
        </p>
      </div>

      {/* FORM */}
      <div className="w-full mt-12 max-w-sm mx-auto flex flex-col gap-5">

        <input
          type="email"
          placeholder="E-mail"
          className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-900
                     text-gray-900 dark:text-white outline-none shadow-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Palavra-passe"
          className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-900
                     text-gray-900 dark:text-white outline-none shadow-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <button
          onClick={() => onLogin(email, password)}
          className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black 
                     font-semibold transition active:scale-[0.97] shadow-md"
        >
          Entrar
        </button>
      </div>

      {/* RODAPÉ */}
      <div className="text-center text-sm mt-16 text-gray-700 dark:text-gray-300">
        Ainda não tem conta?{" "}
        <button
          onClick={onRegisterClick}
          className="underline text-black dark:text-white font-semibold"
        >
          Criar conta gratuita
        </button>
      </div>
    </div>
  );
};
