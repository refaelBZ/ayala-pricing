import React from 'react';
import { Lock } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type Props = Pick<AppState, 'adminPasswordInput' | 'setAdminPasswordInput' | 'navigate' | 'showToast' | 'loginAsAdmin'>;

export const AdminLoginView: React.FC<Props> = ({ adminPasswordInput, setAdminPasswordInput, navigate, showToast, loginAsAdmin }) => {
    const handleLogin = () => {
        if (adminPasswordInput === import.meta.env.VITE_ADMIN_PASSWORD) {
            setAdminPasswordInput('');
            loginAsAdmin();
            navigate('ORDERS_DASHBOARD');
        } else {
            showToast('סיסמה שגויה');
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-soft w-full max-w-sm text-center border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-warning-text opacity-50"></div>

                <div className="w-16 h-16 bg-gradient-to-br from-accent-ghost to-white rounded-full flex items-center justify-center mx-auto mb-6 text-accent shadow-inner">
                    <Lock size={28} />
                </div>

                <h2 className="text-heading-2 mb-2">כניסה למנהלים</h2>
                <p className="text-body-sm text-muted mb-6">יש להזין קוד גישה כדי להמשיך</p>

                <Input
                    type="password"
                    placeholder="קוד גישה"
                    className="text-center text-lg mb-6 tracking-widest bg-white/50 h-14"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />

                <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => navigate('HOME')}>ביטול</Button>
                    <Button fullWidth onClick={handleLogin} className="shadow-primary-glow">כניסה</Button>
                </div>
            </div>
        </div>
    );
};
