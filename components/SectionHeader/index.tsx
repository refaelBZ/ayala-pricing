import React from 'react';
import styles from './style.module.scss';

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
        <h3 className={`${styles.header} ${sizeClass} ${className}`}>
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </h3>
    );
};
