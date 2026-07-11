import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  isAiPrompt?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, isAiPrompt = false, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-[#64748B] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full min-h-[120px] p-3 border rounded-lg text-sm transition-all duration-150',
              isAiPrompt
                ? 'font-mono bg-[#F5F3FF] border-[#7C3AED] text-[#5B21B6] focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent'
                : 'bg-white border-[#CBD5E1] text-[#0F172A] focus:ring-2 focus:ring-[#1B3FAB] focus:border-transparent',
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

Textarea.displayName = 'Textarea';
