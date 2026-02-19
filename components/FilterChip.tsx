import React from 'react';

interface FilterChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-base ${active
                    ? 'bg-chip-active text-chip-active-text shadow-md'
                    : 'bg-white text-secondary border border-light hover:bg-accent-ghost'
                }`}
        >
            {children}
        </button>
    );
};
