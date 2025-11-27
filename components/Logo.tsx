
import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'default', className = "w-32 h-32" }) => {
  // Enforce strict usage of official brand assets from /static/brand/
  // Paths must start with /static/brand/ to be served correctly from the public folder.
  const src = variant === 'white' ? '/static/brand/logo_branco.svg' : '/static/brand/logo_color.svg';

  return (
    <img 
      src={src} 
      alt="Snap Immobile" 
      className={`${className} object-contain`}
      draggable={false}
    />
  );
};
