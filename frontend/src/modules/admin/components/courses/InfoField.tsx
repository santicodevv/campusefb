import type { ReactNode } from 'react';

interface InfoFieldProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export function InfoField({ label, value, valueClassName = "font-medium" }: InfoFieldProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase mb-1">{label}</p>
      <p className={valueClassName}>{value}</p>
    </div>
  );
}
