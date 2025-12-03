// components/LoginScreen.tsx

import React, { useState } from "react";

export interface LoginScreenProps {
  onLogin: (email: string, password: string) => void | Promise<void>;
  onBack: () => void;
  onRegisterClick: () => void;
  error?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onBack,
  onRegisterClick,
  error,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col h-screen bg-white text-black p-6">
      <button onClick={onBack} className="text-blue-700 underline mb-4">
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-6">Iniciar Sessão</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <input
        className="border p-3 mb-3 rounded w-full"
        placeholder="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-3 mb-6 rounded w-full"
        placeholder="Palavra-passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-blue-700 text-white p-3 rounded w-full mb-4"
        onClick={() => onLogin(email, password)}
      >
        Entrar
      </button>

      <button
        className="text-blue-700 underline"
        onClick={onRegisterClick}
      >
        Criar conta
      </button>
    </div>
  );
};
