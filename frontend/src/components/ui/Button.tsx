import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?:     'sm' | 'md' | 'lg';
  loading?:  boolean;
  fullWidth?: boolean;
  icon?:     React.ReactNode;
}

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  ghost:     'hover:bg-slate-100 text-slate-600',
  outline:   'border border-slate-200 hover:bg-slate-50 text-slate-700',
};

const sizes = {
  sm:  'px-3 py-1.5 text-xs',
  md:  'px-4 py-2 text-sm',
  lg:  'px-6 py-3 text-base',
};

export function Button({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        rounded-lg transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : icon
      }
      {children}
    </button>
  );
}