import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "h-12 px-6 rounded-full font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-soft";
  
  const variants = {
    primary: "bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-rose-300/50 hover:shadow-rose-300/70",
    secondary: "bg-white text-coffee-800 border border-rose-100 hover:border-rose-300",
    success: "bg-gradient-to-r from-[#8FBC8F] to-[#6B8E23] text-white",
    danger: "bg-red-50 text-red-500 hover:bg-red-100",
    ghost: "bg-transparent text-coffee-800/60 hover:text-rose-500 shadow-none"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};