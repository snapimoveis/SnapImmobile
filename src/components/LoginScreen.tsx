import React, { useState } from "react";

export interface LoginScreenProps {
  error?: string;
  onLogin: (email: string, password: string) => Promise<void>;
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

  // ✅ CORREÇÃO — função faltando
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div
      className="
        min-h-screen w-full flex flex-col items-center justify-center
        bg-white text-gray-900
        dark:bg-black dark:text-white
        transition-colors duration-300 px-6 py-10
      "
    >
      {/* Seu layout permanece exatamente igual */}


      {/* LOGO */}
      <img
        src={
          document.documentElement.classList.contains("dark")
            ? "/static/brand/logo_branco.png"
            : "/static/brand/logo_color.png"
        }
        alt="Snap Immobile"
        className="w-40 mb-10 transition-all"
      />

      {/* CARD */}
      <div className="
        w-full max-w-sm
        bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200
        dark:bg-black/40 dark:border-gray-800
        p-6
      ">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Iniciar Sessão
        </h1>

        {error && (
          <div className="text-red-500 text-center mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* EMAIL */}
          <div className="flex flex-col">
            <label className="text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
              dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          {/* SENHA */}
          <div className="flex flex-col">
            <label className="text-sm mb-1">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 
              dark:border-gray-700 text-base outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            className="mt-2 py-3 rounded-xl bg-brand-purple text-white font-medium
            hover:bg-brand-purple/90 active:scale-95 transition"
          >
            Entrar
          </button>

          {/* VOLTAR */}
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-600 dark:text-gray-300 underline mt-2 text-center"
          >
            Voltar
          </button>
        </form>
      </div>
    </div>
  );
};
