import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "px-6 rounded-full font-medium transition-all duration-base active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none";

  const sizeStyles = {
    md: 'h-12 text-base shadow-soft',
    lg: 'h-14 text-lg shadow-primary-glow',
  };

  const variants: Record<string, string> = {
    primary: "bg-gradient-to-r from-primary to-primary-hover text-on-primary hover:from-primary-hover hover:to-primary-active",
    secondary: "bg-white text-primary border border-light hover:border-focus hover:bg-accent-ghost",
    success: "bg-success-bg text-success-text border border-success-border hover:opacity-90",
    danger: "bg-danger-bg text-danger-text border border-danger-border hover:opacity-90",
    ghost: "bg-transparent text-secondary hover:text-accent shadow-none hover:bg-accent-ghost",
    outline: "bg-transparent text-accent border-2 border-default hover:border-primary hover:bg-accent-ghost shadow-none",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};