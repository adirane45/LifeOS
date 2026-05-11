import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  download?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
  secondary: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:focus-visible:ring-gray-100 dark:focus-visible:ring-offset-gray-900',
  ghost: 'bg-transparent text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
  danger: 'bg-danger text-white focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = React.forwardRef<any, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className = '', children, href, download, disabled, ...rest }, ref) => {
    const base = `inline-flex items-center justify-center rounded-md gap-2 transition filter`;
    const v = variantClasses[variant] || variantClasses.primary;
    const s = sizeClasses[size] || sizeClasses.md;

    if (href) {
      return (
        <a ref={ref} href={href} download={download} className={`${base} ${v} ${s} ${className}`} {...(rest as any)}>
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : children}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        className={`${base} ${v} ${s} ${className} ${disabled || loading ? 'opacity-60 pointer-events-none' : ''}`}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
