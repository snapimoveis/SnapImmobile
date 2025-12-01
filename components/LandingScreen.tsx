import React from 'react';
import { Button } from './ui';

interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLogin, onFreeTrial }) => {
  return (
    <div className="relative h-screen w-full bg-[#2D1B4E] overflow-hidden font-sans">
      
      {/* Background Image com Overlay Roxo */}
      <div className="absolute inset-0 z-0">
        <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 mix-blend-overlay"
            alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4E]/90 via-[#2D1B4E]/80 to-[#2D1B4E]" />
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 py-12 max-w-md mx-auto justify-center items-center text-center">
        
        {/* LOGO GRANDE */}
        <div className="mb-12 animate-in zoom-in duration-700">
            {/* Modo Claro (se houver fundo claro) / Modo Escuro (se houver fundo escuro) - Aqui forçamos branco porque o fundo é roxo */}
            <img 
              src="/brand/logo_color.png" 
              alt="Snap Immobile" 
              className="w-48 h-auto object-contain brightness-0 invert" 
            />
        </div>

        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            <h2 className="text-white text-lg font-medium tracking-wide uppercase opacity-90">
                AUMENTE A SUA VISIBILIDADE
            </h2>
            
            <p className="text-gray-300 text-base leading-relaxed max-w-xs mx-auto">
                Captação profissional fácil, com qualidade visual através do seu smartphone, para melhorar os seus anúncios de imóveis.
            </p>
        </div>

        <div className="mt-16 w-full space-y-4 animate-in fade-in duration-1000 delay-500">
            <Button onClick={onLogin} variant="outline" size="lg" fullWidth className="border-white text-white hover:bg-white/10">
                JÁ TEM CONTA? ENTRE AQUI
            </Button>
            
            <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                <div className="h-[1px] w-12 bg-gray-600"></div>
                <span>OU</span>
                <div className="h-[1px] w-12 bg-gray-600"></div>
            </div>

            <Button onClick={onFreeTrial} variant="secondary" size="lg" fullWidth>
                FAÇA UM TESTE GRATUITO!
            </Button>
        </div>

      </div>
    </div>
  );
};
