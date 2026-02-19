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
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-orange-50/50">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-soft w-full max-w-sm text-center border border-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-orange-400 opacity-50"></div>

                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                    <Lock size={28} />
                </div>

                <h2 className="text-2xl font-heading font-bold mb-2 text-coffee-800">כניסה למנהלים</h2>
                <p className="text-sm text-gray-500 mb-6">יש להזין קוד גישה כדי להמשיך</p>

                <Input
                    type="password"
                    placeholder="קוד גישה"
                    className="text-center text-lg mb-6 tracking-widest bg-white/50 h-14"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />

                <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => setView('HOME')}>ביטול</Button>
                    <Button fullWidth onClick={handleLogin} className="shadow-lg shadow-rose-200">כניסה</Button>
                </div>
            </div>
        </div>
    );
};
