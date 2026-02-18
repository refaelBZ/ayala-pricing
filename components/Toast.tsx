import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
    message: string;
    show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, show }) => {
    if (!show) return null;
    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-coffee-800 text-cream px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce text-center whitespace-nowrap border border-white/10">
            <span className="flex items-center gap-2">
                <Check size={16} className="text-rose-300" />
                {message}
            </span>
        </div>
    );
};
