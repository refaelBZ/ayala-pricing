import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { IconButton } from './IconButton';

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
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 px-4 py-3 border-b border-light flex items-center justify-between shadow-sm">
            {onBack ? (
                <IconButton
                    icon={<Icon size={20} />}
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    label={backIcon === 'close' ? 'סגור' : 'חזרה'}
                    className="-mr-1"
                />
            ) : (
                <div className="w-10" />
            )}
            <span className="text-heading-3">{title}</span>
            {rightAction || <div className="w-10" />}
        </div>
    );
};
