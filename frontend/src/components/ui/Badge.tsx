interface BadgeProps {
  children:   React.ReactNode;
  variant?:   'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
}

const variants = {
  blue:   'bg-blue-50   text-blue-700   border border-blue-100',
  green:  'bg-green-50  text-green-700  border border-green-100',
  red:    'bg-red-50    text-red-700    border border-red-100',
  yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  purple: 'bg-purple-50 text-purple-700 border border-purple-100',
  gray:   'bg-slate-50  text-slate-600  border border-slate-100',
};

export function Badge({ children, variant = 'blue', className = '' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
}