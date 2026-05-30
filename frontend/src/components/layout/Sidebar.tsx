import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore }         from '../../store/authStore';
import {
  LayoutDashboard, Trophy, Salad, Brain,
  Smartphone, Users, MessageCircle,
  LogOut, Settings, ShieldCheck, Activity,
  BarChart3, Workflow, Rss, ChevronRight,
} from 'lucide-react';

const userNav = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/challenges', label: 'Challenges',  icon: Trophy },
  { to: '/nutrition',  label: 'Nutrition',   icon: Salad },
  { to: '/programs',   label: 'Programs',    icon: Brain },
  { to: '/devices',    label: 'Devices',     icon: Smartphone },
  { to: '/social',     label: 'Social',      icon: Rss },
  { to: '/chat',       label: 'Chat',        icon: MessageCircle },
];

const adminNav = [
  { to: '/admin',                label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/users',          label: 'Users',       icon: Users },
  { to: '/admin/challenges',     label: 'Challenges',  icon: Trophy },
  { to: '/admin/programs',       label: 'Programs',    icon: Brain },
  { to: '/admin/moderation',     label: 'Moderation',  icon: ShieldCheck },
  { to: '/admin/analytics',      label: 'Analytics',   icon: BarChart3 },
  { to: '/admin/pipeline',       label: 'Pipeline',    icon: Workflow },
  { to: '/admin/onboarding',     label: 'Onboarding',  icon: Activity },
  { to: '/admin/chat',           label: 'Chat Logs',   icon: MessageCircle },
  { to: '/admin/config',         label: 'Config',      icon: Settings },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate            = useNavigate();
  const nav                 = isAdmin ? adminNav : userNav;

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <aside className="w-64 h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-40">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">Platform</span>
        </div>
        {isAdmin && (
          <span className="mt-2 inline-block text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
            Admin Panel
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === '/dashboard'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }
              `}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </NavLink>
          ))}
        </div>

        {/* Switch panel link */}
        {user?.role === 'admin' && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <NavLink
              to={isAdmin ? '/dashboard' : '/admin'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <ShieldCheck size={18} />
              {isAdmin ? 'Member View' : 'Admin Panel'}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}