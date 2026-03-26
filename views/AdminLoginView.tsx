import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { AppState } from '../hooks/useAppState';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

type Props = Pick<AppState, 'navigate' | 'showToast' | 'loginAsAdmin'>;

export const AdminLoginView: React.FC<Props> = ({ navigate, showToast, loginAsAdmin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) { showToast('נא למלא אימייל וסיסמה'); return; }
        setIsLoading(true);
        try {
            await loginAsAdmin(email, password);
            // onAuthStateChanged will update state and route guard will redirect
        } catch {
            showToast('פרטי הכניסה שגויים');
        } finally {
            setIsLoading(false);
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
                <p className="text-body-sm text-muted mb-6">הזן פרטי כניסה כדי להמשיך</p>

                <div className="space-y-3 mb-6">
                    <Input
                        type="email"
                        placeholder="אימייל"
                        className="bg-white/50 h-12"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <Input
                        type="password"
                        placeholder="סיסמה"
                        className="text-center text-lg tracking-widest bg-white/50 h-12"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => navigate('HOME')}>ביטול</Button>
                    <Button fullWidth onClick={handleLogin} disabled={isLoading} className="shadow-primary-glow">
                        {isLoading ? '...' : 'כניסה'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
