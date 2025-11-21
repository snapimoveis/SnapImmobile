import React from 'react';

interface LogoProps {
  variant?: 'default' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'default', className = "w-32 h-32" }) => {
  const isWhite = variant === 'white';
  
  // Brand Colors extracted from provided images
  const purple = "#5b21b6"; // Deep Violet
  const orange = "#f97316"; // Bright Orange
  
  const bracketColor = isWhite ? "white" : purple;
  const snapColor = isWhite ? "white" : purple;
  const immobileColor = isWhite ? "white" : orange;

  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top Left Bracket */}
      <path d="M65 25H45C33.9543 25 25 33.9543 25 45V65" stroke={bracketColor} strokeWidth="14" strokeLinecap="round"/>
      
      {/* Top Right Bracket */}
      <path d="M135 25H155C166.046 25 175 33.9543 175 45V65" stroke={bracketColor} strokeWidth="14" strokeLinecap="round"/>
      
      {/* Bottom Left Bracket */}
      <path d="M65 175H45C33.9543 175 25 166.046 25 155V135" stroke={bracketColor} strokeWidth="14" strokeLinecap="round"/>
      
      {/* Bottom Right Bracket */}
      <path d="M135 175H155C166.046 175 175 166.046 175 155V135" stroke={bracketColor} strokeWidth="14" strokeLinecap="round"/>
      
      {/* Text Group */}
      <text 
        x="100" 
        y="115" 
        textAnchor="middle" 
        fontFamily="Inter, sans-serif" 
        fontWeight="800" 
        fontSize="70" 
        fill={snapColor} 
        style={{ letterSpacing: '-0.04em' }}
      >
        snap
      </text>
      <text 
        x="100" 
        y="148" 
        textAnchor="middle" 
        fontFamily="Inter, sans-serif" 
        fontWeight="700" 
        fontSize="22" 
        fill={immobileColor} 
        style={{ letterSpacing: '0.02em' }}
      >
        immobile
      </text>
    </svg>
  );
};