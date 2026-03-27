import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { IconButton } from '../IconButton';
import styles from './style.module.scss';

interface SubHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    backIcon?: 'arrow' | 'close';
}

export const SubHeader: React.FC<SubHeaderProps> = ({
    title,
    onBack,
    rightAction,
    backIcon = 'arrow',
}) => {
    const Icon = backIcon === 'close' ? X : ArrowLeft;
    return (
        <div className={styles.subheader}>
            {onBack ? (
                <IconButton
                    icon={<Icon size={20} />}
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    label={backIcon === 'close' ? 'סגור' : 'חזרה'}
                    className={styles.backButton}
                />
            ) : (
                <div className={styles.spacer} />
            )}
            <span className={styles.title}>{title}</span>
            {rightAction || <div className={styles.spacer} />}
        </div>
    );
};
