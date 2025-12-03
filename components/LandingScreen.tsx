// components/LandingScreen.tsx

import React from "react";
import { AppRoute } from "../types";

export interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onLogin,
  onFreeTrial,
}) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-4">Snap Immobile</h1>

      <p className="text-center text-gray-700 mb-8">
        Apresente os seus imóveis com fotografias profissionais — sem câmaras
        caras, sem conhecimentos técnicos.
      </p>

      <button
        onClick={onLogin}
        className="bg-blue-700 text-white px-6 py-3 rounded w-full max-w-xs mb-4"
      >
        Entrar
      </button>

      <button
        onClick={onFreeTrial}
        className="border border-blue-700 text-blue-700 px-6 py-3 rounded w-full max-w-xs"
      >
        Criar Conta
      </button>
    </div>
  );
};
