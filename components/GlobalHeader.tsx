import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { ViewState } from '../types';

interface GlobalHeaderProps {
    view: ViewState;
    isAdmin: boolean;
    setView: (v: ViewState) => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ view, isAdmin, setView }) => {
    const isCalculatorActive = view === 'HOME' || view === 'CALCULATOR' || view === 'ORDER_FORM';
    const isOrdersActive = view === 'ORDERS_DASHBOARD' || view === 'ORDER_DETAILS' || view === 'ORDER_EDIT';

    return (
        <div className="bg-white border-b border-rose-100 flex items-center justify-between px-5 py-3 sticky top-0 z-40 shadow-sm">
            {/* Brand */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                    <Sparkles size={16} />
                </div>
                <span className="font-heading font-bold text-lg text-coffee-800">Ayala Cakes</span>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center gap-1">
                {/* Calculator Tab - always visible */}
                <button
                    onClick={() => setView('HOME')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isCalculatorActive
                            ? 'bg-rose-50 text-rose-600'
                            : 'text-coffee-800/50 hover:text-coffee-800 hover:bg-rose-50/50'
                        }`}
                >
                    מחשבון
                </button>

                {/* Orders Tab - only visible when admin */}
                {isAdmin && (
                    <button
                        onClick={() => setView('ORDERS_DASHBOARD')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isOrdersActive
                                ? 'bg-rose-50 text-rose-600'
                                : 'text-coffee-800/50 hover:text-coffee-800 hover:bg-rose-50/50'
                            }`}
                    >
                        הזמנות
                    </button>
                )}

                {/* Lock icon - only visible when NOT admin */}
                {!isAdmin && (
                    <button
                        onClick={() => setView('ADMIN_LOGIN')}
                        className="w-9 h-9 flex items-center justify-center text-coffee-800/30 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-50"
                        title="כניסת מנהל"
                    >
                        <Lock size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};
