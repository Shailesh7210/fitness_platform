import { useState }          from 'react';
import { User, Lock, Save }  from 'lucide-react';
import toast                 from 'react-hot-toast';
import { api }               from '../../api/client';
import { useAuthStore }      from '../../store/authStore';
import { UserLayout }        from '../../components/layout/UserLayout';
import { Card }              from '../../components/ui/Card';
import { Badge }             from '../../components/ui/Badge';

export function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
  });

  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword:     '',
    confirm:         '',
  });

  const [saving,   setSaving]   = useState(false);
  const [changing, setChanging] = useState(false);
  const [pErrors,  setPErrors]  = useState<Record<string, string>>({});

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/users/profile', profile);
      setAuth(res.data.user, token!);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password.currentPassword) errs.currentPassword = 'Required';
    if (!password.newPassword)     errs.newPassword     = 'Required';
    if (password.newPassword.length < 6) errs.newPassword = 'Min 6 characters';
    if (password.newPassword !== password.confirm) errs.confirm = 'Passwords do not match';
    setPErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setChanging(true);
    try {
      await api.put('/api/users/change-password', {
        currentPassword: password.currentPassword,
        newPassword:     password.newPassword,
      });
      toast.success('Password changed!');
      setPassword({ currentPassword: '', newPassword: '', confirm: '' });
      setPErrors({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setChanging(false);
    }
  }

  return (
    <UserLayout title="Profile">
      <div className="max-w-2xl space-y-6">

        {/* Avatar card */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-slate-400">{user?.email}</p>
              <Badge variant={user?.role === 'admin' ? 'purple' : 'blue'} className="mt-1 capitalize">
                {user?.role}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Edit profile */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-5">
            <User size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Edit Profile</h3>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(['firstName','lastName'] as const).map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5 capitalize">
                    {field.replace(/([A-Z])/g,' $1')}
                  </label>
                  <input
                    value={profile[field]}
                    onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                value={user?.email}
                disabled
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Card>

        {/* Change password */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {[
              { key: 'currentPassword', label: 'Current Password' },
              { key: 'newPassword',     label: 'New Password' },
              { key: 'confirm',         label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
                <input
                  type="password"
                  value={(password as any)[key]}
                  onChange={e => setPassword(p => ({ ...p, [key]: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                    pErrors[key] ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {pErrors[key] && (
                  <p className="text-xs text-red-500 mt-1">{pErrors[key]}</p>
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={changing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Lock size={15} />
              {changing ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Card>
      </div>
    </UserLayout>
  );
}