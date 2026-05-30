import { useEffect, useState }   from 'react';
import { Link }                  from 'react-router-dom';
import {
  Trophy, Salad, Brain, Smartphone,
  TrendingUp, Flame, Target, ArrowRight,
  CheckCircle2, Clock,
} from 'lucide-react';
import { api }                   from '../../api/client';
import { useAuthStore }          from '../../store/authStore';
import { UserLayout }            from '../../components/layout/UserLayout';
import { Card }                  from '../../components/ui/Card';
import { Badge }                 from '../../components/ui/Badge';
import { Spinner }               from '../../components/ui/Spinner';
import type { Challenge }        from '../../types';

// Pure helper — safe to call outside render
function getDaysLeft(endDate: string): number {
  const diff = new Date(endDate).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

const typeColor: Record<string, 'blue' | 'green' | 'purple' | 'yellow' | 'gray'> = {
  steps:       'blue',
  nutrition:   'green',
  mindfulness: 'purple',
  weight_loss: 'yellow',
  custom:      'gray',
};

export function DashboardPage() {
  const { user }                    = useAuthStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/challenges?limit=3');
        setChallenges(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const quickLinks = [
    { to: '/challenges', icon: Trophy,     label: 'Challenges', color: 'bg-blue-500',   desc: 'Join & track challenges' },
    { to: '/nutrition',  icon: Salad,      label: 'Nutrition',  color: 'bg-green-500',  desc: 'Log meals & weight' },
    { to: '/programs',   icon: Brain,      label: 'Programs',   color: 'bg-purple-500', desc: 'Mind & wellness' },
    { to: '/devices',    icon: Smartphone, label: 'Devices',    color: 'bg-orange-500', desc: 'Connect wearables' },
  ];

  const enrolledCount = challenges.filter(c => c.isEnrolled).length;

  return (
    <UserLayout title="Dashboard">
      <div className="space-y-6">

        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Good day, {user?.firstName}! 👋</h2>
              <p className="text-blue-100 mt-1">Keep up the momentum — you're doing great.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
              <Flame size={20} className="text-orange-300" />
              <span className="font-semibold">Stay consistent!</span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map(({ to, icon: Icon, label, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              <div className="flex items-center gap-1 mt-3 text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Go <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Challenges', value: enrolledCount, icon: Trophy,     color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: 'Current Streak',    value: 0,             icon: Flame,      color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Goals Set',         value: 0,             icon: Target,     color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Progress',          value: '—',           icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} padding="md">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-xl font-bold text-slate-800">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Challenges list */}
        <Card padding="none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Available Challenges</h3>
            <Link
              to="/challenges"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="py-12"><Spinner className="mx-auto" /></div>
          ) : challenges.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No challenges available yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {challenges.map(c => (
                <div
                  key={c._id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Trophy size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={typeColor[c.type] || 'gray'}>{c.type}</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {getDaysLeft(c.endDate)}d left
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.isEnrolled && (
                      <CheckCircle2 size={16} className="text-green-500" />
                    )}
                    <Link
                      to={`/challenges/${c._id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bottom links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/social" className="group block">
            <Card padding="md" className="hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Social Feed</p>
                  <p className="text-sm text-slate-400 mt-0.5">See what others are sharing</p>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
            </Card>
          </Link>
          <Link to="/chat" className="group block">
            <Card padding="md" className="hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">AI Assistant</p>
                  <p className="text-sm text-slate-400 mt-0.5">Get personalized guidance</p>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition" />
              </div>
            </Card>
          </Link>
        </div>

      </div>
    </UserLayout>
  );
}