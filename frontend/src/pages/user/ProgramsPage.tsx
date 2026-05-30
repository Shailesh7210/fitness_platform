import { useEffect, useState } from 'react';
import { Link }                from 'react-router-dom';
import { Brain, Clock, BarChart2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api }                 from '../../api/client';
import { UserLayout }          from '../../components/layout/UserLayout';
import { Card }                from '../../components/ui/Card';
import { Badge }               from '../../components/ui/Badge';
import { Spinner }             from '../../components/ui/Spinner';
import type { MindProgram }    from '../../types';

const categoryColor: Record<string, 'blue'|'purple'|'green'|'yellow'|'gray'> = {
  meditation: 'blue',
  sleep:      'purple',
  stress:     'green',
  focus:      'yellow',
  resilience: 'gray',
};

const difficultyColor: Record<string, 'green'|'yellow'|'red'> = {
  beginner:     'green',
  intermediate: 'yellow',
  advanced:     'red',
};

export function ProgramsPage() {
  const [programs, setPrograms] = useState<MindProgram[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/api/programs')
      .then(res => setPrograms(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout title="Mind Programs">
      <div className="space-y-6">

        {/* Header info */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Mind & Wellness Programs</h2>
          <p className="text-purple-100 text-sm">
            Build lasting habits with structured daily programs for meditation, sleep, stress, and focus.
          </p>
        </div>

        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : programs.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Brain size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">No programs available yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {programs.map(p => (
              <Card
                key={p._id}
                padding="none"
                className="overflow-hidden group hover:shadow-md hover:border-purple-200 transition-all duration-200"
              >
                <div className="h-1.5 bg-purple-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={categoryColor[p.category] || 'blue'} className="capitalize">
                      {p.category}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {p.isEnrolled && <CheckCircle2 size={16} className="text-green-500" />}
                      <Badge variant={difficultyColor[p.difficulty] || 'blue'} className="capitalize">
                        {p.difficulty}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1">{p.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {p.durationDays} days
                    </span>
                    {p.isEnrolled && p.currentDay && (
                      <span className="flex items-center gap-1">
                        <BarChart2 size={12} /> Day {p.currentDay}/{p.durationDays}
                      </span>
                    )}
                    {p.isEnrolled && p.streak !== undefined && (
                      <span className="text-orange-500 font-medium">
                        🔥 {p.streak} streak
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/programs/${p._id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition"
                  >
                    {p.isEnrolled ? 'Continue Program' : 'View Program'}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}