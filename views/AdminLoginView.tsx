import React from 'react';
import { Lock } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type Props = Pick<AppState, 'adminPasswordInput' | 'setAdminPasswordInput' | 'setView' | 'showToast' | 'loginAsAdmin'>;

export const AdminLoginView: React.FC<Props> = ({ adminPasswordInput, setAdminPasswordInput, setView, showToast, loginAsAdmin }) => {
    const handleLogin = () => {
        if (adminPasswordInput === import.meta.env.VITE_ADMIN_PASSWORD) {
            setAdminPasswordInput('');
            loginAsAdmin();
            setView('ORDERS_DASHBOARD');
        } else {
            showToast('סיסמה שגויה');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-cream">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-soft w-full max-w-sm text-center border border-white">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <Lock size={28} />
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2 text-coffee-800">כניסה למנהלים</h2>

                <Input
                    type="password"
                    placeholder="קוד גישה"
                    className="text-center text-lg mb-6 tracking-widest bg-white"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />

                <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => setView('HOME')}>ביטול</Button>
                    <Button fullWidth onClick={handleLogin}>כניסה</Button>
                </div>
            </div>
        </div>
    );
};
