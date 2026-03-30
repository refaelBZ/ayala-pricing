import React from 'react';
import styles from './style.module.scss';

interface ToggleOption {
    value: string;
    label: string;
}

interface ToggleGroupProps {
    options: ToggleOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({ options, value, onChange, className = '' }) => {
    return (
        <div className={`${styles.container} ${className}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`${styles.option} ${value === opt.value ? styles.active : styles.inactive}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};
