// components/LandingScreen.tsx

import React from "react";

interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onLogin,
  onFreeTrial,
}) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden text-white flex flex-col items-center justify-between">
      {/* FUNDO: FOTO */}
      <div className="absolute inset-0">
        <img
          src="/static/brand/modadia-moderna.jpg"
          alt="Fundo Snap Immobile"
          className="w-full h-full object-cover"
        />
      </div>

      {/* OVERLAY: gradiente roxo -> preto + blur */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-b
          from-[#654092]/95
          via-[#3c214f]/90
          to-black/95
          backdrop-blur-sm
        "
      />

      {/* CONTEÚDO SUPERIOR */}
      <div className="relative flex flex-col items-center w-full px-6 mt-10">
        <img
          src="/static/brand/logo_branco.png"
          alt="Snap Immobile"
          className="w-40 mb-8"
        />

        <h2 className="text-center font-semibold text-xs uppercase tracking-[0.18em]">
          AUMENTE A SUA VISIBILIDADE
        </h2>

        <p className="text-center text-xs mt-3 leading-relaxed max-w-xs opacity-90">
          Captação profissional fácil, com qualidade visual através do seu
          smartphone, para melhorar os seus anúncios de imóveis.
        </p>
      </div>

      {/* BOTÕES INFERIORES */}
      <div className="relative flex flex-col w-full max-w-xs mb-12">
        <button
          onClick={onLogin}
          className="w-full border border-white text-white py-3 rounded-full font-semibold text-xs tracking-wide"
        >
          JÁ TEM CONTA? ENTRE AQUI
        </button>

        <div className="flex items-center justify-center text-white mt-4 opacity-70">
          <span className="text-xs">ou</span>
        </div>

        <button
          onClick={onFreeTrial}
          className="w-full bg-[#FF6A2A] text-white py-3 rounded-full font-bold text-xs tracking-wide mt-4"
        >
          FAÇA UM TESTE GRATUITO!
        </button>
      </div>
    </div>
  );
};

export default LandingScreen;
