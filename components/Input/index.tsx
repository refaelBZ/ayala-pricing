import React from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './style.module.scss';

/* ═══════════════════════════════════════════════════════════
   Input Component
   ═══════════════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={`${styles.input} ${className}`}
        {...props}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   TextArea Component
   ═══════════════════════════════════════════════════════════ */

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea
        className={`${styles.textarea} ${className}`}
        {...props}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BaseSelect Component
   ═══════════════════════════════════════════════════════════ */

interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const BaseSelect: React.FC<BaseSelectProps> = ({ label, children, className = '', ...props }) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={`${styles.select} ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className={styles.selectIcon} style={label ? { top: 'calc(50% + 12px)' } : { top: '50%' }}>
        <ChevronRight className={styles.selectIcon} size={16} />
      </div>
    </div>
  );
};