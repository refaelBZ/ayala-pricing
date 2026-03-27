import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, ChefHat, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { ViewState } from '../../types';
import { IconButton } from '../IconButton';
import styles from './style.module.scss';

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
        <header id="global-header" className={styles.header}>
            <div className={styles.container}>
                <div className={styles.row}>

                    {/* Brand */}
                    <button
                        onClick={() => go('HOME')}
                        className={styles.brandLink}
                    >
                        <div className={styles.brandIcon}>
                            <Sparkles size={18} />
                        </div>
                        <span className={styles.brandText}>Ayala Cakes</span>
                    </button>

                    {/* Desktop Nav Tabs — hidden on mobile */}
                    <div className={styles.desktopTabs}>
                        <button
                            onClick={() => go('HOME')}
                            className={`${styles.desktopTab} ${isCalculatorActive ? styles.activeTab : styles.inactiveTab}`}
                        >
                            מחשבון
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => go('ORDERS_DASHBOARD')}
                                    className={`${styles.desktopTab} ${isOrdersActive ? styles.activeTab : styles.inactiveTab}`}
                                >
                                    <ChefHat size={16} /> הזמנות
                                </button>
                                <button
                                    onClick={() => go('ADMIN_DASHBOARD')}
                                    className={`${styles.desktopTab} ${isDashboardActive ? styles.activeTab : styles.inactiveTab}`}
                                >
                                    <LayoutDashboard size={16} /> ניהול
                                </button>
                            </>
                        )}
                    </div>

                    {/* Desktop Right Actions — hidden on mobile */}
                    <div className={styles.rightActions}>
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
                                className={styles.loginBtn}
                            >
                                <Lock size={14} /> כניסה
                            </button>
                        )}
                    </div>

                    {/* Mobile Burger — visible only on mobile */}
                    <button
                        className={styles.burgerBtn}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="תפריט"
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className={styles.mobileMenu}>
                    <nav className={styles.mobileNav}>

                        <button
                            onClick={() => go('HOME')}
                            className={`${styles.mobileNavItem} ${isCalculatorActive ? styles.mobileActive : styles.mobileInactive}`}
                        >
                            <Sparkles size={18} />
                            מחשבון
                        </button>

                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => go('ORDERS_DASHBOARD')}
                                    className={`${styles.mobileNavItem} ${isOrdersActive ? styles.mobileActive : styles.mobileInactive}`}
                                >
                                    <ChefHat size={18} />
                                    הזמנות
                                </button>
                                <button
                                    onClick={() => go('ADMIN_DASHBOARD')}
                                    className={`${styles.mobileNavItem} ${isDashboardActive ? styles.mobileActive : styles.mobileInactive}`}
                                >
                                    <LayoutDashboard size={18} />
                                    ניהול
                                </button>
                            </>
                        )}

                        <div className={styles.mobileMenuDivider}>
                            {isAdmin ? (
                                <button
                                    onClick={handleLogout}
                                    className={styles.mobileLogoutBtn}
                                >
                                    <LogOut size={18} />
                                    יציאה
                                </button>
                            ) : (
                                <button
                                    onClick={() => go('ADMIN_LOGIN')}
                                    className={styles.mobileLoginBtn}
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
