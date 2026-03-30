import React from 'react';
import styles from './style.module.scss';

type IconButtonVariant = 'ghost' | 'danger' | 'accent';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    variant?: IconButtonVariant;
    size?: 'sm' | 'md';
    label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'md',
    label,
    className = '',
    ...props
}) => {
    const classes = [
        styles.iconButton,
        styles[size],
        styles[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            title={label}
            aria-label={label}
            {...props}
        >
            {icon}
        </button>
    );
};
