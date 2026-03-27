import React from 'react';
import styles from './style.module.scss';

interface FilterChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`${styles.chip} ${active ? styles.active : styles.inactive}`}
        >
            {children}
        </button>
    );
};
