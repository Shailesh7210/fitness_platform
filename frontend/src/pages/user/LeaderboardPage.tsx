import { useEffect, useState }  from 'react';
import { useParams, Link }      from 'react-router-dom';
import { Trophy, Medal, ArrowLeft, Crown } from 'lucide-react';
import { api }                  from '../../api/client';
import { UserLayout }           from '../../components/layout/UserLayout';
import { Card }                 from '../../components/ui/Card';
import { Spinner }              from '../../components/ui/Spinner';
import type { LeaderboardResponse } from '../../types';

export function LeaderboardPage() {
  const { id }  = useParams();
  const [data,    setData]    = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/leaderboard/${id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={18} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={18} className="text-slate-400" />;
    if (rank === 3) return <Medal size={18} className="text-orange-400" />;
    return <span className="text-sm font-bold text-slate-400 w-5 text-center">#{rank}</span>;
  };

  const rankBg = (rank: number, isMe: boolean) => {
    if (isMe)   return 'bg-blue-50 border-blue-200';
    if (rank === 1) return 'bg-yellow-50 border-yellow-100';
    if (rank === 2) return 'bg-slate-50 border-slate-100';
    if (rank === 3) return 'bg-orange-50 border-orange-100';
    return 'bg-white border-slate-100';
  };

  return (
    <UserLayout title="Leaderboard">
      <div className="max-w-2xl space-y-6">

        <Link to="/challenges" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} /> Back to Challenges
        </Link>

        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : !data ? (
          <Card padding="lg" className="text-center">
            <p className="text-slate-400">Leaderboard not found</p>
          </Card>
        ) : (
          <>
            {/* Header */}
            <Card padding="md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <Trophy size={24} className="text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-slate-800">{data.challenge.title}</h2>
                  <p className="text-sm text-slate-400 capitalize">{data.challenge.type}</p>
                </div>
                {data.myRank && (
                  <div className="text-center bg-blue-50 rounded-xl px-4 py-2">
                    <p className="text-xs text-slate-400">Your Rank</p>
                    <p className="text-2xl font-bold text-blue-600">#{data.myRank}</p>
                    <p className="text-xs text-slate-500">{data.myScore.toLocaleString()} pts</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Rankings */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Rankings</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {data.entries.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No entries yet. Be the first!
                  </div>
                ) : (
                  data.entries.map(entry => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 px-6 py-4 border ${rankBg(entry.rank, entry.isMe)} transition`}
                    >
                      <div className="flex items-center justify-center w-8">
                        {rankIcon(entry.rank)}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {entry.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {entry.name}
                          {entry.isMe && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">You</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{entry.score.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">points</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </UserLayout>
  );
}