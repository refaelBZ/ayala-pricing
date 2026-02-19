import React from 'react';

interface BaseCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'flat';
    className?: string;
    onClick?: () => void;
}

const variantStyles: Record<string, string> = {
    elevated: 'bg-white rounded-3xl shadow-soft border border-white',
    outlined: 'bg-white rounded-3xl shadow-sm border border-light/50',
    flat: 'bg-accent-ghost/50 rounded-2xl border border-light',
};

export const BaseCard: React.FC<BaseCardProps> = ({
    children,
    variant = 'outlined',
    className = '',
    onClick,
}) => {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            onClick={onClick}
            className={`p-5 text-right ${variantStyles[variant]} ${onClick ? 'cursor-pointer transition-all duration-base hover:shadow-card group' : ''} ${className}`}
        >
            {children}
        </Tag>
    );
};
