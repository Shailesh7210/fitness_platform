import { useState }                            from 'react';
import { Link, useNavigate }                   from 'react-router-dom';
import { Mail, Lock, User, Activity, ArrowRight } from 'lucide-react';
import toast                                   from 'react-hot-toast';
import { api }                                 from '../../api/client';
import { useAuthStore }                        from '../../store/authStore';
import type { AuthResponse }                   from '../../types';

export function RegisterPage() {
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [form,    setForm]    = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    confirm:   '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev  => ({ ...prev,  [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName)                          e.firstName = 'First name is required';
    if (!form.lastName)                           e.lastName  = 'Last name is required';
    if (!form.email)                              e.email     = 'Email is required';
    if (!form.password)                           e.password  = 'Password is required';
    if (form.password.length < 6)                 e.password  = 'Min 6 characters';
    if (form.password !== form.confirm)           e.confirm   = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/register', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      });
      setAuth(res.data.user, res.data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: 'firstName', label: 'First Name',  type: 'text',     placeholder: 'John',            icon: User, half: true },
    { name: 'lastName',  label: 'Last Name',   type: 'text',     placeholder: 'Doe',             icon: User, half: true },
    { name: 'email',     label: 'Email',       type: 'email',    placeholder: 'you@example.com', icon: Mail, half: false },
    { name: 'password',  label: 'Password',    type: 'password', placeholder: '••••••••',        icon: Lock, half: false },
    { name: 'confirm',   label: 'Confirm Password', type: 'password', placeholder: '••••••••',   icon: Lock, half: false },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-2">Start your wellness journey today</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              {fields.filter(f => f.half).map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    {field.label}
                  </label>
                  <div className="relative">
                    <field.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      name={field.name}
                      type={field.type}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className={`
                        w-full pl-9 pr-3 py-3 rounded-xl text-sm
                        bg-white/5 border text-white placeholder-slate-500
                        outline-none transition
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                        ${errors[field.name] ? 'border-red-500/50' : 'border-white/10'}
                      `}
                    />
                  </div>
                  {errors[field.name] && (
                    <p className="mt-1 text-xs text-red-400">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Full width fields */}
            {fields.filter(f => !f.half).map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {field.label}
                </label>
                <div className="relative">
                  <field.icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className={`
                      w-full pl-9 pr-4 py-3 rounded-xl text-sm
                      bg-white/5 border text-white placeholder-slate-500
                      outline-none transition
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                      ${errors[field.name] ? 'border-red-500/50' : 'border-white/10'}
                    `}
                  />
                </div>
                {errors[field.name] && (
                  <p className="mt-1 text-xs text-red-400">{errors[field.name]}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <>Create Account <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}