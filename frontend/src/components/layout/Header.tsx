import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
          <Search size={18} />
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
}