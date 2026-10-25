import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-navy-900 text-white hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 focus-visible:ring-navy-900 shadow-sm',
        secondary:
          'bg-surface-muted text-foreground hover:bg-surface-hover focus-visible:ring-slate-400',
        accent:
          'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent shadow-sm',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-surface-muted focus-visible:ring-slate-400',
        ghost:
          'bg-transparent text-foreground hover:bg-surface-muted focus-visible:ring-slate-400',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-full gap-1.5',
        md: 'h-10 px-4 text-sm rounded-full gap-2',
        lg: 'h-11 px-6 text-base rounded-full gap-2.5',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
