import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingOverlay: React.FC = () => (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-rose-100 flex flex-col items-center">
            <Loader2 className="animate-spin text-rose-400 mb-2" size={32} />
            <span className="text-coffee-800 font-medium">טוען נתונים...</span>
        </div>
    </div>
);
