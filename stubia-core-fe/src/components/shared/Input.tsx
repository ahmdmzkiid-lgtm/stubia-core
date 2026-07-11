import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[#64748B] mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A]',
              'focus:outline-none focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent',
              'placeholder:text-[#64748B]/50 transition-all duration-150',
              error && 'border-[#EF4444] focus:ring-[#EF4444]',
              className
            )
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
