interface CardProps {
  children:   React.ReactNode;
  className?: string;
  padding?:   'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`
      bg-white rounded-xl border border-slate-200
      shadow-sm ${paddings[padding]} ${className}
    `}>
      {children}
    </div>
  );
}