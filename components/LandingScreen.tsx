
import React from 'react';
import { Logo } from './Logo';

interface LandingScreenProps {
  onLogin: () => void;
  onFreeTrial: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onLogin, onFreeTrial }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 font-sans text-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80" 
          alt="Modern Interior" 
          className="w-full h-full object-cover"
        />
        {/* Purple Overlay */}
        <div className="absolute inset-0 bg-[#3b1e54]/90 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3b1e54]/80 to-[#2a123d]/95"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-8 h-full text-center">
        
        {/* Logo Area */}
        <div className="mb-16 flex flex-col items-center justify-center relative">
            <Logo variant="white" className="w-64 h-64" />
        </div>

        {/* Main Text */}
        <div className="mb-12 space-y-4">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-white">
              AUMENTA A SUA VISIBILIDADE
            </h2>
            <p className="text-base text-gray-200 leading-relaxed font-light px-4">
              Captação profissional fácil, com qualidade visual através do seu smartphone, para melhorar os seus anuncio de imóveis.
            </p>
        </div>

        {/* Buttons Area */}
        <div className="w-full space-y-6">
            {/* Login Button */}
            <button 
                onClick={onLogin}
                className="w-full py-3.5 rounded-full border border-white/50 text-white font-medium text-sm tracking-wide hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
                JÁ TEM CONTA? ENTRE AQUI
            </button>

            {/* Separator */}
            <div className="flex items-center gap-4 px-2">
                <div className="flex-1 h-px bg-white/30"></div>
                <span className="text-xs font-medium text-white/70 uppercase tracking-widest">OU</span>
                <div className="flex-1 h-px bg-white/30"></div>
            </div>

            {/* Free Trial Button */}
            <button 
                onClick={onFreeTrial}
                className="w-full py-4 rounded-full bg-[#e05618] text-white font-bold text-sm tracking-wide hover:bg-[#d04b0f] transition-colors shadow-xl shadow-orange-900/30 transform hover:scale-[1.02] active:scale-[0.98]"
            >
                FAÇA UM TESTE GRATUITO!
            </button>
        </div>

      </div>
    </div>
  );
};
