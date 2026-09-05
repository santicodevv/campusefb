// Label component
import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-gray-700 mb-1',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;
