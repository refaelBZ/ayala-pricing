import React from 'react';
import { Check } from 'lucide-react';
import styles from './style.module.scss';

interface ToastProps {
    message: string;
    show: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, show }) => {
    if (!show) return null;
    return (
        <div className={styles.toast}>
            <span className={styles.content}>
                <Check size={16} className={styles.icon} />
                {message}
            </span>
        </div>
    );
};
