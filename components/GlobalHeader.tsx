import React from 'react';
import { Sparkles, Lock, ChefHat, LogOut, LayoutDashboard } from 'lucide-react';
import { ViewState } from '../types';
import { IconButton } from './IconButton';

interface GlobalHeaderProps {
    view: ViewState;
    isAdmin: boolean;
    setView: (v: ViewState) => void;
    logoutAdmin?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ view, isAdmin, setView, logoutAdmin }) => {
    const isCalculatorActive = view === 'HOME' || view === 'CALCULATOR' || view === 'ORDER_FORM';
    const isOrdersActive = view === 'ORDERS_DASHBOARD' || view === 'ORDER_DETAILS' || view === 'ORDER_EDIT';
    const isDashboardActive = view === 'ADMIN_DASHBOARD' || view === 'PRODUCT_EDITOR';

    const activeTabClass = 'bg-primary text-on-primary shadow-lg shadow-primary-glow';
    const inactiveTabClass = 'text-secondary hover:text-primary hover:bg-accent-ghost';

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm transition-all duration-slow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <button
                        onClick={() => setView('HOME')}
                        className="flex items-center gap-2 group transition-opacity hover:opacity-80"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-accent-ghost to-accent-ghost/50 rounded-xl flex items-center justify-center text-accent-soft shadow-sm group-hover:shadow-primary-glow transition-all duration-base">
                            <Sparkles size={18} />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary tracking-tight">Ayala Cakes</span>
                    </button>

                    {/* Nav Tabs */}
                    <div className="flex items-center gap-1 bg-white/50 p-1 rounded-2xl border border-white/50 shadow-inner max-w-[200px] sm:max-w-none overflow-x-auto hide-scrollbar">

                        {/* Calculator Tab */}
                        <button
                            onClick={() => setView('HOME')}
                            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isCalculatorActive ? activeTabClass : inactiveTabClass}`}
                        >
                            מחשבון
                        </button>

                        {/* Admin Tabs */}
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => setView('ORDERS_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isOrdersActive ? activeTabClass : inactiveTabClass}`}
                                >
                                    <ChefHat size={16} />
                                    <span className="hidden sm:inline">הזמנות</span>
                                </button>

                                <button
                                    onClick={() => setView('ADMIN_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isDashboardActive ? activeTabClass : inactiveTabClass}`}
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
                            <IconButton
                                icon={<LogOut size={20} />}
                                variant="ghost"
                                label="יציאה"
                                onClick={() => {
                                    if (logoutAdmin) logoutAdmin();
                                    setView('HOME');
                                }}
                            />
                        ) : (
                            <button
                                onClick={() => setView('ADMIN_LOGIN')}
                                className="px-4 py-2 text-xs font-bold text-secondary bg-white border border-light rounded-xl hover:bg-accent-ghost transition-colors duration-base flex items-center gap-2 shadow-sm"
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
