import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'default',
  className = "w-32 h-32"
}) => {

  const src =
    variant === 'white'
      ? '/static/brand/logo_branco.png'
      : '/static/brand/logo_color.png';

  return (
    <img 
      src={src}
      alt="Snap Immobile"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
};
