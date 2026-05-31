import { useEffect, useState }  from 'react';
import {
  Users, Trophy, FileText,
  Brain, TrendingUp, TrendingDown,
} from 'lucide-react';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Spinner }              from '../../components/ui/Spinner';
import type { AdminStats }      from '../../types';

interface EngagementData {
  period:         string;
  newEnrollments: number;
  newPosts:       number;
  newMealLogs:    number;
}

interface EnrollmentByChallenge {
  challengeId:   string;
  challengeName: string;
  type:          string;
  count:         number;
}

interface UserOverTime {
  date:  string;
  count: number;
}

export function AdminAnalytics() {
  const [overview,     setOverview]     = useState<AdminStats | null>(null);
  const [engagement,   setEngagement]   = useState<EngagementData | null>(null);
  const [enrollments,  setEnrollments]  = useState<EnrollmentByChallenge[]>([]);
  const [usersOverTime,setUsersOverTime]= useState<UserOverTime[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ovRes, engRes, enrRes, uotRes] = await Promise.all([
          api.get('/api/admin/analytics/overview'),
          api.get('/api/admin/analytics/engagement'),
          api.get('/api/admin/analytics/enrollments-by-challenge'),
          api.get('/api/admin/analytics/users-over-time'),
        ]);
        setOverview(ovRes.data);
        setEngagement(engRes.data);
        setEnrollments(enrRes.data || []);
        setUsersOverTime(uotRes.data || []);
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
      <AdminLayout title="Analytics">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </AdminLayout>
    );
  }

  const statCards = [
    { label: 'Total Users',     value: overview?.users.total ?? 0,         icon: Users,   color: 'text-blue-600',   bg: 'bg-blue-50',   trend: overview?.users.growthPercent ?? 0 },
    { label: 'Active Users',    value: overview?.users.active ?? 0,        icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50',  trend: 0 },
    { label: 'Total Challenges',value: overview?.challenges.total ?? 0,    icon: Trophy,  color: 'text-yellow-600', bg: 'bg-yellow-50', trend: 0 },
    { label: 'Total Posts',     value: overview?.content.totalPosts ?? 0,  icon: FileText, color: 'text-purple-600',bg: 'bg-purple-50', trend: 0 },
    { label: 'Meal Logs',       value: overview?.content.totalMealLogs ?? 0, icon: Brain,  color: 'text-orange-600',bg: 'bg-orange-50', trend: 0 },
    { label: 'Program Enrollments', value: overview?.content.totalProgramEnrollments ?? 0, icon: Brain, color: 'text-teal-600', bg: 'bg-teal-50', trend: 0 },
  ];

  // Simple bar chart using div widths
  const maxUsers = Math.max(...usersOverTime.map(d => d.count), 1);

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg, trend }) => (
            <Card key={label} padding="md">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
              {trend !== 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(trend)}% vs last month
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* 7-day engagement */}
        {engagement && (
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-4">Last 7 Days — Engagement</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'New Enrollments', value: engagement.newEnrollments, color: 'bg-blue-500' },
                { label: 'New Posts',       value: engagement.newPosts,       color: 'bg-purple-500' },
                { label: 'New Meal Logs',   value: engagement.newMealLogs,    color: 'bg-green-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-2`} />
                  <p className="text-3xl font-bold text-slate-800">{value}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Users over time chart */}
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-4">
              New Users — Last 30 Days
            </h3>
            {usersOverTime.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {usersOverTime.slice(-14).map(d => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0">
                      {new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(4, (d.count / maxUsers) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-6 text-right">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top challenges by enrollment */}
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-4">
              Top Challenges by Enrollment
            </h3>
            {enrollments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No enrollment data yet</p>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 8).map((e, i) => {
                  const maxCount = enrollments[0]?.count || 1;
                  return (
                    <div key={e.challengeId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {e.challengeName}
                        </p>
                        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(e.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-700 shrink-0">
                        {e.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Platform summary table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Platform Summary</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Total Users',              value: overview?.users.total                         ?? 0 },
              { label: 'New Users This Month',     value: overview?.users.newThisMonth                  ?? 0 },
              { label: 'Active Users',             value: overview?.users.active                         ?? 0 },
              { label: 'Published Challenges',     value: overview?.challenges.published                 ?? 0 },
              { label: 'Total Enrollments',        value: overview?.challenges.totalEnrollments          ?? 0 },
              { label: 'Posts Pending Review',     value: overview?.content.pendingModeration            ?? 0 },
              { label: 'Total Program Enrollments',value: overview?.content.totalProgramEnrollments      ?? 0 },
              { label: 'Total Meal Logs',          value: overview?.content.totalMealLogs                ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="font-semibold text-slate-800">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}