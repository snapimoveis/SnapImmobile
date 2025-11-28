import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white'; // 'default' usa o colorido, 'white' usa o branco
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'default', className = '' }) => {
  // Mapeamento estrito dos arquivos na pasta public
  // Nota: Em Vite/Next/React, arquivos em /public/static são acessados via /static
  const logoSrc = variant === 'white' 
    ? '/static/brand/logo_branco.png' 
    : '/static/brand/logo_color.png';

  return (
    <img 
      src={logoSrc} 
      alt="Snap Immobile" 
      className={`object-contain ${className}`}
      // Adiciona prevenção de erro para debug visual
      onError={(e) => {
        console.error(`ERRO: A imagem não foi encontrada em: ${logoSrc}`);
        e.currentTarget.style.display = 'none'; // Esconde se falhar
      }}
    />
  );
};