import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: (role: string) => void;
  onBack: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    "Sou Corretor",
    "Sou Proprietario",
    "Sou Fotografo",
    "Sou Imobiliária"
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col">
        
        {/* Header Logo */}
        <div className="flex justify-center mt-8 mb-12 relative">
          <Logo className="w-32 h-32" />
          {/* Decorative Icon from screenshot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-700 opacity-80">
             <RefreshCw className="w-8 h-8 animate-spin-slow" />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo!</h1>
          <p className="text-gray-600 text-sm">
            Vamos personalizar a sua experiência.<br/>
            O que você faz?
          </p>
        </div>

        <div className="space-y-4 flex-1">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`w-full py-4 px-6 rounded-xl text-left font-medium transition-all duration-200 ${
                selectedRole === role
                  ? 'bg-purple-100 border-2 border-purple-600 text-purple-900 shadow-sm'
                  : 'bg-gray-200/70 border-2 border-transparent text-gray-700 hover:bg-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8 pb-4">
          <button 
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>

          <button
            onClick={() => selectedRole && onNext(selectedRole)}
            disabled={!selectedRole}
            className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all ${
              selectedRole 
                ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-md' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            SEGUINTE
          </button>
        </div>

      </div>
    </div>
  );
};
