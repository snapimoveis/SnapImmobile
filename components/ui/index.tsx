import React from 'react';

// === BOTÃO REUTILIZÁVEL ===
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  isLoading = false,
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-[#623aa2] hover:bg-[#4e2c84] text-white shadow-lg shadow-purple-900/20 border border-transparent", // Roxo Principal
    secondary: "bg-[#e85d04] hover:bg-[#d05000] text-white shadow-md shadow-orange-900/20 border border-transparent", // Laranja de Destaque
    outline: "bg-transparent border-2 border-[#623aa2] text-[#623aa2] hover:bg-[#623aa2]/5",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
    white: "bg-white text-[#623aa2] hover:bg-gray-50 border border-gray-200 shadow-sm"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg",
    md: "text-sm px-6 py-3 rounded-xl",
    lg: "text-base px-8 py-4 rounded-full", // Botões grandes e redondos como no login
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
      ) : null}
      {children}
    </button>
  );
};

// === INPUT DE TEXTO PADRÃO ===
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
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#623aa2] transition-colors">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-gray-100 dark:bg-[#1e1e1e] border-2 border-transparent 
            focus:border-[#623aa2] focus:bg-white dark:focus:bg-black 
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

// === CARD GENÉRICO ===
export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void, hoverEffect?: boolean }> = ({ children, className = '', onClick, hoverEffect = false }) => (
  <div 
    onClick={onClick} 
    className={`
      bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden
      ${hoverEffect ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-[#623aa2]/30' : 'shadow-sm'}
      ${onClick ? 'cursor-pointer' : ''} 
      ${className}
    `}
  >
    {children}
  </div>
);
