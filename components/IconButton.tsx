import React from 'react';

type IconButtonVariant = 'ghost' | 'danger' | 'accent';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: IconButtonVariant;
    size?: 'sm' | 'md';
    label?: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
    ghost: 'bg-accent-ghost text-accent-soft hover:bg-primary-ghost hover:text-primary transition-colors',
    danger: 'bg-white text-accent-muted border border-light hover:text-danger-text hover:bg-danger-bg transition-colors',
    accent: 'bg-accent-ghost text-accent-soft hover:bg-rose-100 hover:text-primary transition-colors',
};

const sizeStyles = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
};

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    label,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`inline-flex items-center justify-center transition-all duration-base active:scale-95 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            title={label}
            aria-label={label}
            {...props}
        >
            {icon}
        </button>
    );
};
