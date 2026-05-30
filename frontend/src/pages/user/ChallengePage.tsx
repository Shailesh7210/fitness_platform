import { useEffect, useState }  from 'react';
import { Link }                 from 'react-router-dom';
import { Trophy, Search, Users, Calendar, Target, ArrowRight } from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { UserLayout }           from '../../components/layout/UserLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Spinner }              from '../../components/ui/Spinner';
import type { Challenge }       from '../../types';

const TYPE_OPTIONS = ['all','steps','nutrition','mindfulness','weight_loss','custom'];

const typeColor: Record<string, 'blue'|'green'|'purple'|'yellow'|'gray'> = {
  steps:       'blue',
  nutrition:   'green',
  mindfulness: 'purple',
  weight_loss: 'yellow',
  custom:      'gray',
};

// Pure function — no Date.now() called during render
function getDaysLeft(endDate: string): number {
  const end  = new Date(endDate).getTime();
  const now  = new Date().getTime();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

export function ChallengePage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [type,       setType]       = useState('all');
  const [enrolling,  setEnrolling]  = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (search) params.set('search', search);
      if (type !== 'all') params.set('type', type);
      const res = await api.get(`/api/challenges?${params}`);
      setChallenges(res.data.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [type]);

  async function handleEnroll(id: string, enrolled: boolean) {
    setEnrolling(id);
    try {
      if (enrolled) {
        await api.delete(`/api/challenges/${id}/leave`);
        toast.success('Left challenge');
      } else {
        await api.post(`/api/challenges/${id}/enroll`);
        toast.success('Enrolled successfully!');
      }
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <UserLayout title="Challenges">
      <div className="space-y-6">

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="Search challenges..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition ${
                  type === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {t === 'all' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : challenges.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Trophy size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">No challenges found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map(c => (
              <Card
                key={c._id}
                padding="none"
                className="overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                <div className={`h-1.5 ${c.isEnrolled ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={typeColor[c.type] || 'gray'} className="capitalize">
                      {c.type.replace('_', ' ')}
                    </Badge>
                    {c.isEnrolled && <Badge variant="green">Enrolled</Badge>}
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{c.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{c.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      {c.goal.target.toLocaleString()} {c.goal.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {c.enrolledCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {getDaysLeft(c.endDate)}d left
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnroll(c._id, !!c.isEnrolled)}
                      disabled={enrolling === c._id}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        c.isEnrolled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {enrolling === c._id ? '...' : c.isEnrolled ? 'Leave' : 'Enroll'}
                    </button>
                    <Link
                      to={`/challenges/${c._id}`}
                      className="p-2 rounded-lg border border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-600 transition"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}