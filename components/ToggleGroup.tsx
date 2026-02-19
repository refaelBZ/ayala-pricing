import React from 'react';

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
        <div className={`flex gap-4 p-1 bg-white rounded-2xl shadow-sm border border-subtle ${className}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all duration-base ${value === opt.value
                            ? 'bg-primary text-on-primary shadow-md shadow-primary-glow'
                            : 'text-secondary hover:bg-accent-ghost'
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};
