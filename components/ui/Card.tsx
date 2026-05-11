import React from 'react';
import clsx from 'clsx';

type Accent = 'default' | 'blue' | 'green' | 'amber' | 'red';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  accent?: Accent;
  children?: React.ReactNode;
}

const accentMap: Record<Accent, string> = {
  default: 'bg-transparent',
  blue: 'bg-primary',
  green: 'bg-success',
  amber: 'bg-warning',
  red: 'bg-danger',
};

export default function Card({ title, icon, accent = 'default', children, className, ...rest }: CardProps) {
  return (
    <div className={clsx('rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm overflow-hidden', className)} {...rest}>
      <div className={clsx('h-1', accentMap[accent])} />
      <div className="p-4">
        {(title || icon) && (
          <div className="flex items-center gap-3 mb-2">
            {icon}
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
        )}
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}
