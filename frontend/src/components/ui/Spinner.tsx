export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"
      />
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Spinner size={40} />
    </div>
  );
}