import React from 'react';
import { ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Input Component
   ═══════════════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-body-sm font-medium mb-1.5 text-secondary mr-1">{label}</label>}
      <input
        className={`w-full h-12 px-5 rounded-2xl border border-light bg-white/80 focus:border-focus focus:ring-2 focus:ring-accent-ghost focus:outline-none transition-all duration-base placeholder:text-accent-muted/50 ${className}`}
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
    <div className="w-full">
      {label && <label className="block text-body-sm font-medium mb-1.5 text-secondary mr-1">{label}</label>}
      <textarea
        className={`w-full p-4 rounded-2xl border border-light bg-white/80 focus:border-focus focus:ring-2 focus:ring-accent-ghost focus:outline-none transition-all duration-base placeholder:text-accent-muted/50 ${className}`}
        {...props}
      />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BaseSelect Component
   Replaces the raw <select> pattern duplicated across views.
   ═══════════════════════════════════════════════════════════ */

interface BaseSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const BaseSelect: React.FC<BaseSelectProps> = ({ label, children, className = '', ...props }) => {
  return (
    <div className="w-full relative">
      {label && <label className="block text-body-sm font-medium mb-1.5 text-secondary mr-1">{label}</label>}
      <select
        className={`w-full h-12 px-5 rounded-2xl border border-light bg-white focus:border-focus focus:outline-none appearance-none text-secondary transition-all duration-base ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted" style={label ? { top: 'calc(50% + 12px)' } : {}}>
        <ChevronRight className="rotate-90" size={16} />
      </div>
    </div>
  );
};