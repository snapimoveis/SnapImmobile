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
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <img
          src="/static/brand/modadia-moderna.jpg"
          className="w-full h-full object-cover"
        />
        {/* Overlay roxo → preto + blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#654092]/70 to-black/90 backdrop-blur-[2px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* LOGO (modo claro/escuro automático) */}
        <img
          src="/static/brand/logo_color.png"
          className="w-40 hidden dark:block"
          draggable={false}
        />
        <img
          src="/static/brand/logo_branca.png"
          className="w-40 dark:hidden"
          draggable={false}
        />

        <h1 className="text-white text-3xl font-bold mt-6">
          Bem-vindo ao Snap Immobile
        </h1>

        <p className="text-white/80 mt-2 max-w-xs">
          Fotografe, edite e publique os seus imóveis com qualidade profissional.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-10">
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold shadow-lg"
          >
            Iniciar Sessão
          </button>

          <button
            onClick={onFreeTrial}
            className="w-full py-3 rounded-xl bg-[#654092] text-white font-semibold shadow-lg"
          >
            Teste Gratuito
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
