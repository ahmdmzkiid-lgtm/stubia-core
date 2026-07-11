import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 'Done' | 'InProgress' | 'Pending' | 'Rejected' | 'AI-Gen' | 'Blocked' | 'Warning' | 'Safe' | 'Default';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className }) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold';
  
  const variants = {
    Done: 'bg-[#D1FAE5] text-[#065F46]',
    InProgress: 'bg-[#E0F2FE] text-[#0369A1]',
    Pending: 'bg-[#FEF3C7] text-[#92400E]',
    Rejected: 'bg-[#FEE2E2] text-[#991B1B]',
    'AI-Gen': 'bg-[#EDE9FE] text-[#5B21B6]',
    Blocked: 'bg-[#FEE2E2] text-[#991B1B]',
    Warning: 'bg-[#FEF3C7] text-[#92400E]',
    Safe: 'bg-[#D1FAE5] text-[#065F46]',
    Default: 'bg-[#F1F5F9] text-[#64748B]'
  };

  const getIcon = () => {
    switch (variant) {
      case 'Blocked':
        return <span className="text-[10px]">🔴</span>;
      case 'Warning':
        return <span className="text-[10px]">⚠️</span>;
      case 'Safe':
        return <span className="text-[10px]">✅</span>;
      case 'AI-Gen':
        return <span className="text-[10px]">✨</span>;
      default:
        return null;
    }
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], className))}>
      {getIcon()}
      {children || variant}
    </span>
  );
};
