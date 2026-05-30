interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:   string;
  error?:   string;
  icon?:    React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border border-slate-200 bg-white
            px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400
            outline-none transition
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            disabled:bg-slate-50 disabled:text-slate-400
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}
            ${icon  ? 'pl-9' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}