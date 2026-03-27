import React from 'react';
import styles from './style.module.scss';

interface BaseCardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'flat';
    className?: string;
    onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
    children,
    variant = 'outlined',
    className = '',
    onClick,
}) => {
    const Tag = onClick ? 'button' : 'div';
    
    const classes = [
        styles.card,
        styles[variant],
        onClick ? styles.interactive : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Tag
            onClick={onClick}
            className={classes}
        >
            {children}
        </Tag>
    );
};
