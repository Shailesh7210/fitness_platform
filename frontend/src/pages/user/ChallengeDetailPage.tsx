import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, Users, Calendar, Target, ArrowLeft, BarChart2 } from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { UserLayout }           from '../../components/layout/UserLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Spinner }              from '../../components/ui/Spinner';
import type { Challenge }       from '../../types';

export function ChallengeDetailPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    api.get(`/api/challenges/${id}`)
      .then(res => setChallenge(res.data))
      .catch(() => navigate('/challenges'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fix: useMemo so Date.now() is not called during render directly
  const daysLeft = useMemo(() => {
    if (!challenge) return 0;
    const diff = new Date(challenge.endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [challenge]);

  async function handleEnroll() {
    if (!challenge) return;
    setEnrolling(true);
    try {
      if (challenge.isEnrolled) {
        await api.delete(`/api/challenges/${id}/leave`);
        toast.success('Left challenge');
        setChallenge(prev => prev ? { ...prev, isEnrolled: false } : prev);
      } else {
        await api.post(`/api/challenges/${id}/enroll`);
        toast.success('Enrolled!');
        setChallenge(prev => prev ? { ...prev, isEnrolled: true } : prev);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return (
    <UserLayout title="Challenge">
      <div className="py-20"><Spinner className="mx-auto" /></div>
    </UserLayout>
  );
  if (!challenge) return null;

  return (
    <UserLayout title={challenge.title}>
      <div className="max-w-3xl space-y-6">
        <Link to="/challenges" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} /> Back to Challenges
        </Link>

        <Card padding="lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Trophy size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{challenge.title}</h1>
                <Badge variant="blue" className="mt-1 capitalize">
                  {challenge.type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            {challenge.isEnrolled && <Badge variant="green">Enrolled</Badge>}
          </div>

          <p className="text-slate-600 mb-6">{challenge.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Target,   label: 'Goal',      value: `${challenge.goal.target.toLocaleString()} ${challenge.goal.unit}` },
              { icon: Users,    label: 'Enrolled',  value: challenge.enrolledCount.toLocaleString() },
              { icon: Calendar, label: 'Starts',    value: new Date(challenge.startDate).toLocaleDateString() },
              { icon: Calendar, label: 'Days Left', value: `${daysLeft} days` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                <Icon size={18} className="mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-slate-400">{label}</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                challenge.isEnrolled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
              } disabled:opacity-50`}
            >
              {enrolling ? '...' : challenge.isEnrolled ? 'Leave Challenge' : 'Join Challenge'}
            </button>
            {challenge.isEnrolled && (
              <Link
                to={`/leaderboard/${challenge._id}`}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
              >
                <BarChart2 size={16} /> Leaderboard
              </Link>
            )}
          </div>
        </Card>

        {challenge.rules && (
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-3">Rules</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{challenge.rules}</p>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}