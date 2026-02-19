import React from 'react';

interface SectionHeaderProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    size?: 'lg' | 'md';
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    icon,
    children,
    size = 'md',
    className = '',
}) => {
    const sizeClass = size === 'lg' ? 'text-heading-2' : 'text-heading-3';
    return (
        <h3 className={`${sizeClass} flex items-center gap-2 px-1 ${className}`}>
            {icon && <span className="text-accent-soft">{icon}</span>}
            {children}
        </h3>
    );
};
