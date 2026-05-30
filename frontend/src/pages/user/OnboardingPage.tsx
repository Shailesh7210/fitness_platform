import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import { CheckCircle2 }        from 'lucide-react';
import toast                   from 'react-hot-toast';
import { api }                 from '../../api/client';
import { UserLayout }          from '../../components/layout/UserLayout';
import { Card }                from '../../components/ui/Card';
import { Spinner }             from '../../components/ui/Spinner';
import type { Questionnaire, Question } from '../../types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [currentQ,      setCurrentQ]      = useState<Question | null>(null);
  const [answers,       setAnswers]        = useState<Record<string, any>>({});
  const [loading,       setLoading]        = useState(true);
  const [saving,        setSaving]         = useState(false);
  const [completed,     setCompleted]      = useState(false);

  useEffect(() => {
    api.get('/api/onboarding')
      .then(res => {
        const q = res.data.questionnaire as Questionnaire;
        setQuestionnaire(q);
        if (res.data.isComplete) {
          setCompleted(true);
          return;
        }
        const saved = res.data.savedResponse;
        if (saved?.answers) setAnswers(saved.answers);
        const startId = saved?.currentQuestionId || q.questions[0]?.id;
        const startQ  = q.questions.find(x => x.id === startId) || q.questions[0];
        setCurrentQ(startQ || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function getNext(q: Question, answer: any): Question | null {
    if (!questionnaire) return null;
    const nextId = q.branchMap?.[answer] || q.nextQuestionId;
    return questionnaire.questions.find(x => x.id === nextId) || null;
  }

  async function handleAnswer(answer: any) {
    if (!currentQ || !questionnaire) return;
    const newAnswers = { ...answers, [currentQ.id]: answer };
    setAnswers(newAnswers);
    setSaving(true);

    try {
      await api.patch('/api/onboarding/save', {
        answers:           newAnswers,
        currentQuestionId: currentQ.id,
        questionnaireId:   questionnaire._id,
        version:           questionnaire.version,
      });

      const next = getNext(currentQ, answer);
      if (next) {
        setCurrentQ(next);
      } else {
        await api.post('/api/onboarding/complete', {
          answers:         newAnswers,
          questionnaireId: questionnaire._id,
          version:         questionnaire.version,
        });
        setCompleted(true);
        toast.success('Onboarding complete!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const progress = questionnaire && currentQ
    ? Math.round(((questionnaire.questions.findIndex(q => q.id === currentQ.id)) / questionnaire.questions.length) * 100)
    : 0;

  if (loading) return <UserLayout title="Onboarding"><div className="py-20"><Spinner className="mx-auto" /></div></UserLayout>;

  if (completed) return (
    <UserLayout title="Onboarding">
      <div className="max-w-md mx-auto pt-10 text-center">
        <Card padding="lg">
          <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">You're all set!</h2>
          <p className="text-slate-500 mb-6">Your profile has been personalised based on your answers.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </Card>
      </div>
    </UserLayout>
  );

  if (!questionnaire || !currentQ) return (
    <UserLayout title="Onboarding">
      <Card padding="lg" className="max-w-md mx-auto mt-10 text-center">
        <p className="text-slate-400">No onboarding questionnaire available yet.</p>
      </Card>
    </UserLayout>
  );

  return (
    <UserLayout title="Onboarding">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>Getting to know you</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <Card padding="lg">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
            {questionnaire.name}
          </p>
          <h2 className="text-xl font-bold text-slate-800 mb-6">{currentQ.label}</h2>

          {/* Single / Multi choice */}
          {(currentQ.type === 'single' || currentQ.type === 'multi') && (
            <div className="space-y-3">
              {currentQ.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  disabled={saving}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Text input */}
          {currentQ.type === 'text' && (
            <div className="space-y-3">
              <input
                id="text-answer"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Type your answer..."
              />
              <button
                onClick={() => {
                  const val = (document.getElementById('text-answer') as HTMLInputElement)?.value;
                  if (val) handleAnswer(val);
                }}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Number input */}
          {currentQ.type === 'number' && (
            <div className="space-y-3">
              <input
                id="num-answer"
                type="number"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter a number..."
              />
              <button
                onClick={() => {
                  const val = (document.getElementById('num-answer') as HTMLInputElement)?.value;
                  if (val) handleAnswer(Number(val));
                }}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Boolean */}
          {currentQ.type === 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => handleAnswer(opt.value)}
                  disabled={saving}
                  className="py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </UserLayout>
  );
}