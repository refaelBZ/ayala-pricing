import React from 'react';
import { Sparkles, Lock, ChefHat, LogOut, LayoutDashboard } from 'lucide-react';
import { ViewState } from '../types';

interface GlobalHeaderProps {
    view: ViewState;
    isAdmin: boolean;
    setView: (v: ViewState) => void;
    logoutAdmin?: () => void; // Add this prop
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ view, isAdmin, setView, logoutAdmin }) => {
    const isCalculatorActive = view === 'HOME' || view === 'CALCULATOR' || view === 'ORDER_FORM';
    const isOrdersActive = view === 'ORDERS_DASHBOARD' || view === 'ORDER_DETAILS' || view === 'ORDER_EDIT';
    const isDashboardActive = view === 'ADMIN_DASHBOARD' || view === 'PRODUCT_EDITOR';

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <button
                        onClick={() => setView('HOME')}
                        className="flex items-center gap-2 group transition-opacity hover:opacity-80"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-rose-100 to-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:shadow-rose-200 transition-all">
                            <Sparkles size={18} />
                        </div>
                        <span className="font-heading font-bold text-xl text-coffee-800 tracking-tight">Ayala Cakes</span>
                    </button>

                    {/* Nav Tabs */}
                    <div className="flex items-center gap-1 bg-white/50 p-1 rounded-2xl border border-white/50 shadow-inner max-w-[200px] sm:max-w-none overflow-x-auto hide-scrollbar">

                        {/* Calculator Tab */}
                        <button
                            onClick={() => setView('HOME')}
                            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${isCalculatorActive
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                : 'text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50'
                                }`}
                        >
                            מחשבון
                        </button>

                        {/* Admin Tabs */}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setView('ORDERS_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${isOrdersActive
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                        : 'text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50'
                                        }`}
                                >
                                    <ChefHat size={16} />
                                    <span className="hidden sm:inline">הזמנות</span>
                                </button>

                                <button
                                    onClick={() => setView('ADMIN_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${isDashboardActive
                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                                        : 'text-coffee-800/60 hover:text-coffee-800 hover:bg-rose-50'
                                        }`}
                                >
                                    <LayoutDashboard size={16} />
                                    <span className="hidden sm:inline">ניהול</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 pl-2">
                        {isAdmin ? (
                            <button
                                onClick={() => {
                                    if (logoutAdmin) logoutAdmin();
                                    setView('HOME');
                                }}
                                className="w-10 h-10 flex items-center justify-center text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="יציאה"
                            >
                                <LogOut size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={() => setView('ADMIN_LOGIN')}
                                className="px-4 py-2 text-xs font-bold text-coffee-800/70 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Lock size={14} />
                                <span>כניסה</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
