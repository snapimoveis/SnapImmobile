import React from 'react';

// === BOTÃO ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  icon,
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-brand-purple hover:bg-brand-darkPurple text-white shadow-lg shadow-brand-purple/20 border border-transparent", 
    secondary: "bg-brand-orange hover:bg-brand-orange-hover text-white shadow-md shadow-orange-900/20 border border-transparent", 
    outline: "bg-transparent border-2 border-brand-purple text-brand-purple hover:bg-brand-purple/5",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
    white: "bg-white text-brand-purple hover:bg-gray-50 border border-gray-200 shadow-sm"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-sm px-6 py-3 rounded-xl",
    lg: "text-base px-8 py-4 rounded-full", 
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`} 
      {...props}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// === INPUT ===
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, icon, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-purple transition-colors">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-brand-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent 
            focus:border-brand-purple focus:bg-white dark:focus:bg-black 
            text-gray-900 dark:text-white placeholder-gray-400 
            rounded-xl transition-all duration-200 outline-none
            ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 font-medium
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium ml-1 animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
});

// === CARD ===
export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, hoverEffect?: boolean }> = ({ children, className = '', onClick, hoverEffect = false }) => (
  <div 
    onClick={onClick} 
    className={`
      bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden
      ${hoverEffect ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-brand-purple/30' : 'shadow-card'}
      ${onClick ? 'cursor-pointer' : ''} 
      ${className}
    `}
  >
    {children}
  </div>
);
