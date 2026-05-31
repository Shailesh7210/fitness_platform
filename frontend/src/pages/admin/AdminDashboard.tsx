import { useEffect, useState }  from 'react';
import { Link }                 from 'react-router-dom';
import {
  Users, Trophy, FileText, ShieldAlert,
  TrendingUp, TrendingDown, ArrowRight,
  Activity, BarChart3,
} from 'lucide-react';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Spinner }              from '../../components/ui/Spinner';
import { Badge }                from '../../components/ui/Badge';
import type { AdminStats }      from '../../types';

export function AdminDashboard() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, engRes] = await Promise.all([
          api.get('/api/admin/analytics/overview'),
          api.get('/api/admin/analytics/engagement'),
        ]);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label:    'Total Users',
      value:    stats?.users.total ?? 0,
      sub:      `+${stats?.users.newThisMonth ?? 0} this month`,
      icon:     Users,
      color:    'text-blue-600',
      bg:       'bg-blue-50',
      trend:    (stats?.users.growthPercent ?? 0) >= 0 ? 'up' : 'down',
      trendVal: `${Math.abs(stats?.users.growthPercent ?? 0)}%`,
    },
    {
      label:    'Challenges',
      value:    stats?.challenges.total ?? 0,
      sub:      `${stats?.challenges.published ?? 0} published`,
      icon:     Trophy,
      color:    'text-yellow-600',
      bg:       'bg-yellow-50',
      trend:    'up',
      trendVal: `${stats?.challenges.totalEnrollments ?? 0} enrollments`,
    },
    {
      label:    'Total Posts',
      value:    stats?.content.totalPosts ?? 0,
      sub:      `${stats?.content.pendingModeration ?? 0} pending review`,
      icon:     FileText,
      color:    'text-purple-600',
      bg:       'bg-purple-50',
      trend:    (stats?.content.pendingModeration ?? 0) > 0 ? 'down' : 'up',
      trendVal: `${stats?.content.pendingModeration ?? 0} flagged`,
    },
    {
      label:    'Program Enrollments',
      value:    stats?.content.totalProgramEnrollments ?? 0,
      sub:      `${stats?.content.totalMealLogs ?? 0} meal logs`,
      icon:     Activity,
      color:    'text-green-600',
      bg:       'bg-green-50',
      trend:    'up',
      trendVal: 'Active users',
    },
  ];

  const quickLinks = [
    { to: '/admin/users',      label: 'Manage Users',      icon: Users,      color: 'bg-blue-600' },
    { to: '/admin/challenges', label: 'Challenges',        icon: Trophy,     color: 'bg-yellow-500' },
    { to: '/admin/moderation', label: 'Moderation Queue',  icon: ShieldAlert,color: 'bg-red-500' },
    { to: '/admin/analytics',  label: 'Analytics',         icon: BarChart3,  color: 'bg-purple-600' },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">

        {/* Welcome */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">Platform Overview</h2>
          <p className="text-slate-400 text-sm">
            Here's what's happening across your platform today.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color, bg, trend, trendVal }) => (
            <Card key={label} padding="md">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-500'
                }`}>
                  {trend === 'up'
                    ? <TrendingUp  size={13} />
                    : <TrendingDown size={13} />
                  }
                  {trendVal}
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">{value.toLocaleString()}</p>
              <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </Card>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map(({ to, label, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-blue-500 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Pending moderation alert */}
        {(stats?.content.pendingModeration ?? 0) > 0 && (
          <Card padding="md" className="border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-800">
                    {stats?.content.pendingModeration} post{(stats?.content.pendingModeration ?? 0) > 1 ? 's' : ''} pending review
                  </p>
                  <p className="text-sm text-orange-600">
                    These posts have been flagged by users and need your attention.
                  </p>
                </div>
              </div>
              <Link
                to="/admin/moderation"
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition shrink-0"
              >
                Review Now
              </Link>
            </div>
          </Card>
        )}

        {/* Bottom grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/pipeline" className="group block">
            <Card padding="md" className="hover:border-blue-200 hover:shadow-md transition-all h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800">EOD Pipeline</p>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
              <p className="text-sm text-slate-400">
                View and manage end-of-day processing jobs
              </p>
            </Card>
          </Link>
          <Link to="/admin/analytics" className="group block">
            <Card padding="md" className="hover:border-blue-200 hover:shadow-md transition-all h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800">Analytics</p>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
              <p className="text-sm text-slate-400">
                User growth, engagement metrics, and trends
              </p>
            </Card>
          </Link>
          <Link to="/admin/config" className="group block">
            <Card padding="md" className="hover:border-blue-200 hover:shadow-md transition-all h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-800">Platform Config</p>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
              <p className="text-sm text-slate-400">
                Branding, colors, labels, and feature flags
              </p>
            </Card>
          </Link>
        </div>

      </div>
    </AdminLayout>
  );
}