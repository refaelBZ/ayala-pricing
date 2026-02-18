import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1.5 text-coffee-800/80 mr-1">{label}</label>}
      <input 
        className={`w-full h-12 px-5 rounded-2xl border border-rose-100 bg-white/80 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all placeholder:text-rose-300/50 ${className}`}
        {...props}
      />
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-1.5 text-coffee-800/80 mr-1">{label}</label>}
        <textarea 
          className={`w-full p-4 rounded-2xl border border-rose-100 bg-white/80 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all placeholder:text-rose-300/50 ${className}`}
          {...props}
        />
      </div>
    );
};