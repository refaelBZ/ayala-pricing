import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, ChefHat, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { ViewState } from '../types';
import { IconButton } from './IconButton';

interface GlobalHeaderProps {
    view: ViewState;
    isAdmin: boolean;
    navigate: (v: ViewState) => void;
    logoutAdmin?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ view, isAdmin, navigate, logoutAdmin }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const isCalculatorActive = view === 'HOME' || view === 'CALCULATOR' || view === 'ORDER_FORM';
    const isOrdersActive = view === 'ORDERS_DASHBOARD' || view === 'ORDER_DETAILS' || view === 'ORDER_EDIT';
    const isDashboardActive = view === 'ADMIN_DASHBOARD' || view === 'PRODUCT_EDITOR' || view === 'GLOBAL_CATEGORY_EDITOR' || view === 'DICTIONARY_MANAGER';

    const activeTabClass = 'bg-primary text-on-primary shadow-lg shadow-primary-glow';
    const inactiveTabClass = 'text-secondary hover:text-primary hover:bg-accent-ghost';

    // Close menu on view change
    useEffect(() => { setMenuOpen(false); }, [view]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('#global-header')) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const go = (v: ViewState) => { navigate(v); setMenuOpen(false); };

    const handleLogout = () => {
        if (logoutAdmin) logoutAdmin();
        navigate('HOME');
        setMenuOpen(false);
    };

    return (
        <header id="global-header" className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Brand */}
                    <button
                        onClick={() => go('HOME')}
                        className="flex items-center gap-2 group transition-opacity hover:opacity-80"
                    >
                        <div className="w-9 h-9 bg-gradient-to-br from-accent-ghost to-accent-ghost/50 rounded-xl flex items-center justify-center text-accent-soft shadow-sm group-hover:shadow-primary-glow transition-all duration-base">
                            <Sparkles size={18} />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary tracking-tight">Ayala Cakes</span>
                    </button>

                    {/* Desktop Nav Tabs — hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-1 bg-white/50 p-1 rounded-2xl border border-white/50 shadow-inner">
                        <button
                            onClick={() => go('HOME')}
                            className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isCalculatorActive ? activeTabClass : inactiveTabClass}`}
                        >
                            מחשבון
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => go('ORDERS_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isOrdersActive ? activeTabClass : inactiveTabClass}`}
                                >
                                    <ChefHat size={16} /> הזמנות
                                </button>
                                <button
                                    onClick={() => go('ADMIN_DASHBOARD')}
                                    className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-slow flex items-center gap-2 whitespace-nowrap ${isDashboardActive ? activeTabClass : inactiveTabClass}`}
                                >
                                    <LayoutDashboard size={16} /> ניהול
                                </button>
                            </>
                        )}
                    </div>

                    {/* Desktop Right Actions — hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2">
                        {isAdmin ? (
                            <IconButton
                                icon={<LogOut size={20} />}
                                variant="ghost"
                                label="יציאה"
                                onClick={handleLogout}
                            />
                        ) : (
                            <button
                                onClick={() => go('ADMIN_LOGIN')}
                                className="px-4 py-2 text-xs font-bold text-secondary bg-white border border-light rounded-xl hover:bg-accent-ghost transition-colors duration-base flex items-center gap-2 shadow-sm"
                            >
                                <Lock size={14} /> כניסה
                            </button>
                        )}
                    </div>

                    {/* Mobile Burger — visible only on mobile */}
                    <button
                        className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl text-secondary hover:bg-accent-ghost transition-colors"
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="תפריט"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="sm:hidden border-t border-white/20 bg-white/95 backdrop-blur-xl shadow-lg">
                    <nav className="flex flex-col p-3 gap-1">

                        <button
                            onClick={() => go('HOME')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-right transition-colors ${isCalculatorActive ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-accent-ghost'}`}
                        >
                            <Sparkles size={18} />
                            מחשבון
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => go('ORDERS_DASHBOARD')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-right transition-colors ${isOrdersActive ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-accent-ghost'}`}
                                >
                                    <ChefHat size={18} />
                                    הזמנות
                                </button>
                                <button
                                    onClick={() => go('ADMIN_DASHBOARD')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-right transition-colors ${isDashboardActive ? 'bg-primary text-on-primary' : 'text-secondary hover:bg-accent-ghost'}`}
                                >
                                    <LayoutDashboard size={18} />
                                    ניהול
                                </button>
                            </>
                        )}

                        <div className="border-t border-subtle mt-1 pt-2">
                            {isAdmin ? (
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 w-full transition-colors"
                                >
                                    <LogOut size={18} />
                                    יציאה
                                </button>
                            ) : (
                                <button
                                    onClick={() => go('ADMIN_LOGIN')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-secondary hover:bg-accent-ghost w-full transition-colors"
                                >
                                    <Lock size={18} />
                                    כניסה למנהלים
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};
