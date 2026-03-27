import React from 'react';
import styles from './style.module.scss';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children, className = '' }) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
};
