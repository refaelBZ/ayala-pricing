import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './style.module.scss';

export const LoadingOverlay: React.FC = () => (
    <div className={styles.overlay}>
        <div className={styles.box}>
            <Loader2 className={styles.icon} size={32} />
            <span className={styles.text}>טוען נתונים...</span>
        </div>
    </div>
);
