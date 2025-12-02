import React from "react";
import { Button } from "./ui";

interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onLogin,
  onFreeTrial,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-[#2D1B4E] overflow-hidden font-sans flex flex-col">

      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/95 to-[#2D1B4E]" />
      </div>

      {/* ================= CONTAINER ================= */}
      <div className="relative z-10 flex flex-col flex-1 px-6 py-12 max-w-lg mx-auto justify-center text-center">

        {/* LOGO */}
        <div className="mb-12 animate-in zoom-in duration-700 flex justify-center">
          <img
            src="/brand/logo_color.png"
            alt="Snap Immobile"
            className="w-40 md:w-52 h-auto object-contain brightness-0 invert"
          />
        </div>

        {/* TEXTOS PRINCIPAIS */}
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 delay-200 px-2">
          <h2 className="text-white text-lg md:text-xl font-semibold tracking-wide uppercase opacity-90">
            AUMENTE A SUA VISIBILIDADE
          </h2>

          <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-md mx-auto">
            Fotografe imóveis com qualidade profissional usando apenas o seu smartphone.
            Melhore os seus anúncios e conquiste mais clientes.
          </p>
        </div>

        {/* BOTÕES */}
        <div className="mt-14 w-full space-y-5 animate-in fade-in duration-700 delay-300">

          {/* BOTÃO LOGIN */}
          <Button
            onClick={onLogin}
            variant="outline"
            size="lg"
            fullWidth
            className="border-white text-white hover:bg-white/10 transition"
          >
            JÁ TEM CONTA? ENTRAR
          </Button>

          {/* Separador */}
          <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
            <div className="h-[1px] w-12 bg-gray-600" />
            <span>OU</span>
            <div className="h-[1px] w-12 bg-gray-600" />
          </div>

          {/* TESTE GRÁTIS */}
          <Button
            onClick={onFreeTrial}
            variant="secondary"
            size="lg"
            fullWidth
          >
            FAZER TESTE GRATUITO
          </Button>
        </div>

        {/* RODAPÉ (OPCIONAL) */}
        <div className="mt-12 text-gray-400 text-xs opacity-60">
          © {new Date().getFullYear()} Snap Immobile
        </div>

      </div>
    </div>
  );
};
