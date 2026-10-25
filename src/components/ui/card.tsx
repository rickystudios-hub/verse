import * as React from 'react';
import { cn } from '@/lib/utils';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface text-card-foreground shadow-sm transition-all',
        className
      )}
      {...props}
    />
  );
};
