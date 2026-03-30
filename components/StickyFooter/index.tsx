import React from 'react';
import styles from './style.module.scss';

interface StickyFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`${styles.footer} ${className}`}>
            <div className={styles.container}>
                {children}
            </div>
        </div>
    );
};
