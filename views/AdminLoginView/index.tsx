import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { AppState } from '../../hooks/useAppState';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import styles from './style.module.scss';

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
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <div className={styles.topGradientBar}></div>

                <div className={styles.iconCircle}>
                    <Lock size={28} />
                </div>

                <h2 className={styles.title}>כניסה למנהלים</h2>
                <p className={styles.subtitle}>הזן פרטי כניסה כדי להמשיך</p>

                <div className={styles.inputGroup}>
                    <Input
                        type="email"
                        placeholder="אימייל"
                        className={styles.inputField}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <Input
                        type="password"
                        placeholder="סיסמה"
                        className={styles.passwordField}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                </div>

                <div className={styles.actionGroup}>
                    <Button variant="ghost" fullWidth onClick={() => navigate('HOME')}>ביטול</Button>
                    <Button fullWidth onClick={handleLogin} disabled={isLoading} className={styles.loginBtn}>
                        {isLoading ? '...' : 'כניסה'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
