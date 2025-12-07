import React from "react";

interface LandingProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

const LandingScreen: React.FC<LandingProps> = ({
  onLogin,
  onFreeTrial,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-black overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/static/brand/modadia-moderna.jpg"
          className="w-full h-full object-cover opacity-90 dark:opacity-40"
        />

        {/* Dark mode overlay */}
        <div className="absolute inset-0 bg-white/50 dark:bg-black/70 backdrop-blur-md" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        <img
          src={
            document.documentElement.classList.contains("dark")
              ? "/static/brand/logo_branco.png"
              : "/static/brand/logo_color.png"
          }
          className="w-40 mb-10 drop-shadow-xl"
        />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Bem-vindo ao Snap Immobile
        </h1>

        <p className="text-gray-700 dark:text-gray-300 max-w-md mb-10">
          Fotografe, melhore e apresente imóveis com qualidade profissional.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={onLogin}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-semibold shadow-lg"
          >
            Entrar
          </button>

          <button
            onClick={onFreeTrial}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-xl font-semibold shadow-lg"
          >
            Testar Gratuitamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;