import * as React from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  size = 'md',
  className,
  href = '/',
}) => {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={cn('flex items-center gap-2.5 font-bold tracking-tight select-none', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-navy-950 via-navy-800 to-accent text-white shadow-md',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5/6 w-5/6 text-white drop-shadow-sm"
        >
          {/* Geometria refinada em V */}
          <path d="M4 4l8 16 8-16" />
          <path d="M9 12h6" strokeOpacity="0.6" strokeWidth="2" />
        </svg>
      </div>
      {showText && (
        <span className={cn('font-black text-foreground tracking-widest', textSizes[size])}>
          {APP_CONFIG.name}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
