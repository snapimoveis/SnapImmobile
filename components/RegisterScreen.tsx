// components/RegisterScreen.tsx

import React, { useState } from "react";

export interface RegisterScreenProps {
  onBack: () => void;
  onSubmit: (data: any) => void | Promise<void>;
  error?: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onSubmit,
  error,
}) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-white p-6">
      <button onClick={onBack} className="text-blue-700 underline mb-4">
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-6">Criar Conta</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <input
        className="border p-3 mb-3 rounded w-full"
        placeholder="Primeiro Nome"
        value={form.firstName}
        onChange={(e) => handleChange("firstName", e.target.value)}
      />

      <input
        className="border p-3 mb-3 rounded w-full"
        placeholder="Último Nome"
        value={form.lastName}
        onChange={(e) => handleChange("lastName", e.target.value)}
      />

      <input
        className="border p-3 mb-3 rounded w-full"
        placeholder="E-mail"
        type="email"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />

      <input
        className="border p-3 mb-6 rounded w-full"
        placeholder="Palavra-passe"
        type="password"
        value={form.password}
        onChange={(e) => handleChange("password", e.target.value)}
      />

      <button
        className="bg-blue-700 text-white p-3 rounded w-full"
        onClick={() => onSubmit(form)}
      >
        Criar Conta
      </button>
    </div>
  );
};
