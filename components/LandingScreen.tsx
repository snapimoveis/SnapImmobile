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
    <div
      className="h-screen w-full flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage:
          "url('/static/brand/modadia-moderna.jpg')", // coloque aqui tua imagem de fundo
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      {/* Overlay roxo */}
      <div className="absolute inset-0 bg-[#3b1d57]/70" />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">

        {/* LOGO */}
        <img
          src="/static/brand/logo_branco.png"
          alt="Snap Immobile"
          className="w-40 mb-10"
        />

        {/* TÍTULO */}
        <h1 className="text-lg font-bold tracking-wide mb-2">
          AUMENTE A SUA VISIBILIDADE
        </h1>

        {/* TEXTO SECUNDÁRIO */}
        <p className="text-sm mb-10 max-w-xs opacity-90 leading-relaxed">
          Captação profissional fácil, com qualidade visual através do seu smartphone,
          para melhorar os seus anúncios de imóveis.
        </p>

        {/* BOTÃO LOGIN */}
        <button
          onClick={onLogin}
          className="
            w-64 py-3 mb-4 border border-white rounded-full
            text-white text-sm font-semibold tracking-wide
            hover:bg-white hover:text-[#3b1d57] transition
          "
        >
          JÁ TEM CONTA? ENTRE AQUI
        </button>

        {/* DIVISOR */}
        <div className="flex items-center w-64 mb-4">
          <div className="flex-1 h-px bg-white/40"></div>
          <span className="px-2 text-xs opacity-80">ou</span>
          <div className="flex-1 h-px bg-white/40"></div>
        </div>

        {/* BOTÃO TESTE GRATUITO */}
        <button
          onClick={onFreeTrial}
          className="
            w-64 py-3 rounded-full text-white text-sm font-semibold tracking-wide
            bg-orange-600 hover:bg-orange-500 transition
          "
        >
          FAÇA UM TESTE GRATUITO!
        </button>
      </div>
    </div>
  );
};

export default LandingScreen;
