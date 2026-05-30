import { useEffect, useState }  from 'react';
import {
  Plus, Trash2, Target,
  TrendingDown, Salad, Scale,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { UserLayout }           from '../../components/layout/UserLayout';
import { Card }                 from '../../components/ui/Card';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import { Badge }                from '../../components/ui/Badge';
import type {
  MealLog, WeightLog,
  NutritionGoal, Recommendation,
} from '../../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const mealColor: Record<string, 'blue' | 'green' | 'purple' | 'yellow'> = {
  breakfast: 'blue',
  lunch:     'green',
  dinner:    'purple',
  snack:     'yellow',
};

const recColor: Record<string, 'red' | 'yellow' | 'blue'> = {
  high:   'red',
  medium: 'yellow',
  low:    'blue',
};

// ── Macro progress bar ────────────────────────────────────────────────
function MacroBar({
  label, value, max, color,
}: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">
          {Math.round(value)}g / {max}g
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Shared input styles ───────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

export function NutritionPage() {
  const today = new Date().toISOString().split('T')[0];

  const [meals,   setMeals]   = useState<MealLog[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [goal,    setGoal]    = useState<NutritionGoal | null>(null);
  const [recs,    setRecs]    = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'meals' | 'weight' | 'goals' | 'tips'>('meals');

  // Modals
  const [mealModal,   setMealModal]   = useState(false);
  const [weightModal, setWeightModal] = useState(false);
  const [goalModal,   setGoalModal]   = useState(false);
  const [saving,      setSaving]      = useState(false);

  // Forms
  const blankMeal = {
    foodName: '', mealType: 'breakfast', calories: '',
    protein: '', carbs: '', fat: '',
    date: today, quantity: '1', unit: 'serving', notes: '',
  };
  const [mealForm,   setMealForm]   = useState(blankMeal);
  const [weightForm, setWeightForm] = useState({ weight: '', unit: 'kg', date: today, notes: '' });
  const [goalForm,   setGoalForm]   = useState({
    dailyCalories: '2000', dailyProtein: '50',
    dailyCarbs: '250', dailyFat: '65',
    targetWeight: '0', dietType: 'standard',
  });

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [mealsRes, weightsRes, goalRes, recsRes] = await Promise.all([
          api.get(`/api/nutrition/meals?date=${today}`),
          api.get('/api/nutrition/weight?limit=10'),
          api.get('/api/nutrition/goals'),
          api.get('/api/nutrition/recommendations'),
        ]);
        setMeals(mealsRes.data.meals     || []);
        setWeights(weightsRes.data       || []);
        setGoal(goalRes.data);
        setRecs(recsRes.data.recommendations || []);
        if (goalRes.data) {
          setGoalForm({
            dailyCalories: String(goalRes.data.dailyCalories),
            dailyProtein:  String(goalRes.data.dailyProtein),
            dailyCarbs:    String(goalRes.data.dailyCarbs),
            dailyFat:      String(goalRes.data.dailyFat),
            targetWeight:  String(goalRes.data.targetWeight),
            dietType:      goalRes.data.dietType,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Daily totals ─────────────────────────────────────────────────
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein:  acc.protein  + m.protein,
      carbs:    acc.carbs    + m.carbs,
      fat:      acc.fat      + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // ── Add meal ─────────────────────────────────────────────────────
  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/nutrition/meals', {
        ...mealForm,
        calories: Number(mealForm.calories),
        protein:  Number(mealForm.protein),
        carbs:    Number(mealForm.carbs),
        fat:      Number(mealForm.fat),
        quantity: Number(mealForm.quantity),
      });
      toast.success('Meal logged!');
      setMealModal(false);
      setMealForm(blankMeal);
      const res = await api.get(`/api/nutrition/meals?date=${today}`);
      setMeals(res.data.meals || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log meal');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete meal ──────────────────────────────────────────────────
  async function deleteMeal(id: string) {
    try {
      await api.delete(`/api/nutrition/meals/${id}`);
      toast.success('Meal removed');
      setMeals(prev => prev.filter(m => m._id !== id));
    } catch {
      toast.error('Failed to delete meal');
    }
  }

  // ── Add weight ───────────────────────────────────────────────────
  async function addWeight(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/nutrition/weight', {
        ...weightForm,
        weight: Number(weightForm.weight),
      });
      toast.success('Weight logged!');
      setWeightModal(false);
      setWeightForm({ weight: '', unit: 'kg', date: today, notes: '' });
      const res = await api.get('/api/nutrition/weight?limit=10');
      setWeights(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log weight');
    } finally {
      setSaving(false);
    }
  }

  // ── Save goals ───────────────────────────────────────────────────
  async function saveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/nutrition/goals', {
        dailyCalories:  Number(goalForm.dailyCalories),
        dailyProtein:   Number(goalForm.dailyProtein),
        dailyCarbs:     Number(goalForm.dailyCarbs),
        dailyFat:       Number(goalForm.dailyFat),
        targetWeight:   Number(goalForm.targetWeight),
        dietType:       goalForm.dietType,
      });
      setGoal(res.data.goal);
      toast.success('Goals saved!');
      setGoalModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <UserLayout title="Nutrition">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Nutrition">
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(['meals', 'weight', 'goals', 'tips'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                tab === t
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'tips' ? 'AI Tips' : t}
            </button>
          ))}
        </div>

        {/* ── MEALS ───────────────────────────────────────────────── */}
        {tab === 'meals' && (
          <div className="space-y-4">

            {/* Macro summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Calories', value: totals.calories, unit: 'kcal', max: goal?.dailyCalories || 2000, color: 'bg-blue-500' },
                { label: 'Protein',  value: totals.protein,  unit: 'g',    max: goal?.dailyProtein  || 50,   color: 'bg-green-500' },
                { label: 'Carbs',    value: totals.carbs,    unit: 'g',    max: goal?.dailyCarbs    || 250,  color: 'bg-yellow-500' },
                { label: 'Fat',      value: totals.fat,      unit: 'g',    max: goal?.dailyFat      || 65,   color: 'bg-red-400' },
              ].map(({ label, value, unit, max, color }) => (
                <Card key={label} padding="md">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {Math.round(value)}
                    <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Goal: {max} {unit}</p>
                </Card>
              ))}
            </div>

            {/* Meal list */}
            <Card padding="none">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Today's Meals</h3>
                <button
                  onClick={() => setMealModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  <Plus size={16} /> Log Meal
                </button>
              </div>

              {meals.length === 0 ? (
                <div className="py-16 text-center">
                  <Salad size={36} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">No meals logged today</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {MEAL_TYPES.map(type => {
                    const typeMeals = meals.filter(m => m.mealType === type);
                    if (typeMeals.length === 0) return null;
                    return (
                      <div key={type}>
                        <div className="px-6 py-2 bg-slate-50">
                          <Badge variant={mealColor[type]} className="capitalize">{type}</Badge>
                        </div>
                        {typeMeals.map(m => (
                          <div
                            key={m._id}
                            className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition"
                          >
                            <div>
                              <p className="font-medium text-slate-800 text-sm">{m.foodName}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {m.quantity} {m.unit} · P:{m.protein}g · C:{m.carbs}g · F:{m.fat}g
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-slate-700">{m.calories} kcal</span>
                              <button
                                onClick={() => deleteMeal(m._id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── WEIGHT ──────────────────────────────────────────────── */}
        {tab === 'weight' && (
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Weight Log</h3>
              <button
                onClick={() => setWeightModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus size={16} /> Log Weight
              </button>
            </div>

            {weights.length === 0 ? (
              <div className="py-16 text-center">
                <Scale size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">No weight entries yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {weights.map((w, i) => (
                  <div
                    key={w._id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {w.weight} {w.unit}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(w.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {i > 0 && (
                      <span className={`text-sm font-medium ${
                        w.weight < weights[i - 1].weight
                          ? 'text-green-600'
                          : 'text-red-500'
                      }`}>
                        {w.weight < weights[i - 1].weight ? '↓' : '↑'}{' '}
                        {Math.abs(w.weight - weights[i - 1].weight).toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── GOALS ───────────────────────────────────────────────── */}
        {tab === 'goals' && goal && (
          <Card padding="md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-blue-600" />
                <h3 className="font-semibold text-slate-800">Daily Nutrition Goals</h3>
              </div>
              <button
                onClick={() => setGoalModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                Edit Goals
              </button>
            </div>
            <div className="space-y-4">
              <MacroBar label="Calories" value={totals.calories} max={goal.dailyCalories} color="bg-blue-500" />
              <MacroBar label="Protein"  value={totals.protein}  max={goal.dailyProtein}  color="bg-green-500" />
              <MacroBar label="Carbs"    value={totals.carbs}    max={goal.dailyCarbs}    color="bg-yellow-500" />
              <MacroBar label="Fat"      value={totals.fat}      max={goal.dailyFat}      color="bg-red-400" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-400">Target Weight</p>
                <p className="font-bold text-slate-800 mt-0.5">{goal.targetWeight} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Weekly Loss Rate</p>
                <p className="font-bold text-slate-800 mt-0.5">{goal.weeklyLossRate} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Diet Type</p>
                <p className="font-bold text-slate-800 mt-0.5 capitalize">{goal.dietType}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── AI TIPS ─────────────────────────────────────────────── */}
        {tab === 'tips' && (
          <div className="space-y-3">
            {recs.length === 0 ? (
              <Card padding="lg" className="text-center">
                <TrendingDown size={36} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">
                  No recommendations yet. Log some meals first!
                </p>
              </Card>
            ) : (
              recs.map((rec, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-start gap-4">
                    <Badge
                      variant={recColor[rec.priority] || 'blue'}
                      className="capitalize mt-0.5 shrink-0"
                    >
                      {rec.priority}
                    </Badge>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{rec.message}</p>
                      <p className="text-sm text-blue-600 mt-1">{rec.action}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Add Meal Modal ─────────────────────────────────────────── */}
      <Modal open={mealModal} onClose={() => setMealModal(false)} title="Log a Meal">
        <form onSubmit={addMeal} className="space-y-4">
          <div>
            <label className={labelCls}>Food Name</label>
            <input
              value={mealForm.foodName}
              onChange={e => setMealForm(p => ({ ...p, foodName: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Grilled Chicken"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Meal Type</label>
              <select
                value={mealForm.mealType}
                onChange={e => setMealForm(p => ({ ...p, mealType: e.target.value }))}
                className={inputCls}
              >
                {MEAL_TYPES.map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                value={mealForm.date}
                onChange={e => setMealForm(p => ({ ...p, date: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories', label: 'Calories (kcal)', placeholder: '0' },
              { key: 'protein',  label: 'Protein (g)',     placeholder: '0' },
              { key: 'carbs',    label: 'Carbs (g)',       placeholder: '0' },
              { key: 'fat',      label: 'Fat (g)',         placeholder: '0' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input
                  type="number"
                  value={(mealForm as any)[key]}
                  onChange={e => setMealForm(p => ({ ...p, [key]: e.target.value }))}
                  className={inputCls}
                  placeholder={placeholder}
                  required={key === 'calories'}
                />
              </div>
            ))}
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input
              value={mealForm.notes}
              onChange={e => setMealForm(p => ({ ...p, notes: e.target.value }))}
              className={inputCls}
              placeholder="Any notes..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Meal'}
          </button>
        </form>
      </Modal>

      {/* ── Add Weight Modal ───────────────────────────────────────── */}
      <Modal open={weightModal} onClose={() => setWeightModal(false)} title="Log Weight">
        <form onSubmit={addWeight} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Weight</label>
              <input
                type="number"
                step="0.1"
                value={weightForm.weight}
                onChange={e => setWeightForm(p => ({ ...p, weight: e.target.value }))}
                className={inputCls}
                placeholder="70.5"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select
                value={weightForm.unit}
                onChange={e => setWeightForm(p => ({ ...p, unit: e.target.value }))}
                className={inputCls}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input
              type="date"
              value={weightForm.date}
              onChange={e => setWeightForm(p => ({ ...p, date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input
              value={weightForm.notes}
              onChange={e => setWeightForm(p => ({ ...p, notes: e.target.value }))}
              className={inputCls}
              placeholder="Any notes..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Weight'}
          </button>
        </form>
      </Modal>

      {/* ── Edit Goals Modal ───────────────────────────────────────── */}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Edit Nutrition Goals">
        <form onSubmit={saveGoals} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'dailyCalories', label: 'Daily Calories (kcal)' },
              { key: 'dailyProtein',  label: 'Daily Protein (g)'     },
              { key: 'dailyCarbs',    label: 'Daily Carbs (g)'       },
              { key: 'dailyFat',      label: 'Daily Fat (g)'         },
              { key: 'targetWeight',  label: 'Target Weight (kg)'    },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input
                  type="number"
                  value={(goalForm as any)[key]}
                  onChange={e => setGoalForm(p => ({ ...p, [key]: e.target.value }))}
                  className={inputCls}
                />
              </div>
            ))}
            <div>
              <label className={labelCls}>Diet Type</label>
              <select
                value={goalForm.dietType}
                onChange={e => setGoalForm(p => ({ ...p, dietType: e.target.value }))}
                className={inputCls}
              >
                {['standard', 'keto', 'vegetarian', 'vegan', 'paleo'].map(d => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </Modal>
    </UserLayout>
  );
}