import React from 'react';

interface StickyFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-light z-30 ${className}`}>
            <div className="max-w-2xl mx-auto">
                {children}
            </div>
        </div>
    );
};
