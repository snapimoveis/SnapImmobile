import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'default', className = '' }) => {
  // Caminhos fixos - NÃO ALTERAR A ESTRUTURA DE FICHEIROS
  const logoSrc = variant === 'white' 
    ? '/static/brand/logo_branco.png' 
    : '/static/brand/logo_color.png';

  return (
    <img 
      src={logoSrc} 
      alt="Snap Immobile" 
      className={`object-contain ${className}`}
      onError={(e) => {
        // Fallback silencioso para evitar quebra de layout
        console.warn(`Asset missing: ${logoSrc}`);
        e.currentTarget.style.display = 'none'; 
      }}
    />
  );
};
