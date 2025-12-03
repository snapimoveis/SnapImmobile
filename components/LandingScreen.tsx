import React, { useEffect, useState } from "react";

interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({
  onLogin,
  onFreeTrial,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detecta dark mode de forma compatível com Vercel (SSR-friendly)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(mq.matches);

      const listener = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-black transition-colors duration-300">

      {/* Fundo com imagem + overlay */}
      <div className="absolute inset-0">
        <img
          src="/static/brand/modadia-moderna.jpg"
          className="w-full h-full object-cover opacity-80 dark:opacity-60"
          alt="Snap Immobile Background"
        />
        <div className="absolute inset-0 bg-white/50 dark:bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* LOGO RESPONSIVA */}
        <img
          src={
            isDarkMode
              ? "/static/brand/logo_branca.png"
              : "/static/brand/logo_color.png"
          }
          alt="Snap Immobile"
          className="w-40 mb-10 drop-shadow-xl transition-all duration-300"
        />

        {/* TÍTULO */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Bem-vindo ao Snap Immobile
        </h1>

        <p className="text-gray-700 dark:text-gray-300 max-w-md mb-10">
          Fotografe, melhore e apresente imóveis com qualidade profissional.
        </p>

        {/* BOTÕES */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={onLogin}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-semibold shadow-lg shadow-black/20 dark:shadow-white/10 transition"
          >
            Entrar
          </button>

          <button
            onClick={onFreeTrial}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-xl font-semibold shadow-lg shadow-purple-900/30"
          >
            Testar Gratuitamente
          </button>
        </div>

      </div>
    </div>
  );
};

export default LandingScreen;
