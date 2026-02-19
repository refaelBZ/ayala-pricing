import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-success-bg text-success-text border-success-border',
    warning: 'bg-warning-bg text-warning-text border-warning-border',
    danger: 'bg-danger-bg text-danger-text border-danger-border',
    info: 'bg-info-bg text-info-text border-info-border',
    neutral: 'bg-neutral-bg text-neutral-text border-neutral-border',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children, className = '' }) => {
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
};
