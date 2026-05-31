import { useEffect, useState }  from 'react';
import { Save, Eye }            from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Spinner }              from '../../components/ui/Spinner';
import type { TenantConfig }    from '../../types';

export function AdminConfig() {
  const [config,  setConfig]  = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/config');
        setConfig(res.data.config || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/api/admin/config', config);
      toast.success('Configuration saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function updateBranding(key: string, value: string) {
    setConfig(prev => prev ? {
      ...prev,
      branding: { ...prev.branding, [key]: value },
    } : prev);
  }

  function updateLabel(key: string, value: string) {
    setConfig(prev => prev ? {
      ...prev,
      labels: { ...prev.labels, [key]: value },
    } : prev);
  }

  function updateFeature(key: string, value: boolean) {
    setConfig(prev => prev ? {
      ...prev,
      features: { ...prev.features, [key]: value },
    } : prev);
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

  if (loading) {
    return (
      <AdminLayout title="Platform Config">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </AdminLayout>
    );
  }

  if (!config) return null;

  return (
    <AdminLayout title="Platform Config">
      <form onSubmit={handleSave} className="space-y-6">

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Changes apply immediately after saving.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-blue-300 transition"
            >
              <Eye size={15} /> Preview
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Branding */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-800 mb-4">Branding</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>App Name</label>
              <input
                value={config.branding.appName}
                onChange={e => updateBranding('appName', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Font Family</label>
              <input
                value={config.branding.fontFamily}
                onChange={e => updateBranding('fontFamily', e.target.value)}
                className={inputCls}
                placeholder="Inter"
              />
            </div>
            <div>
              <label className={labelCls}>Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.branding.primaryColor}
                  onChange={e => updateBranding('primaryColor', e.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  value={config.branding.primaryColor}
                  onChange={e => updateBranding('primaryColor', e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="#2563EB"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.branding.accentColor}
                  onChange={e => updateBranding('accentColor', e.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  value={config.branding.accentColor}
                  onChange={e => updateBranding('accentColor', e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="#1B2A4A"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Logo URL</label>
              <input
                value={config.branding.logoUrl}
                onChange={e => updateBranding('logoUrl', e.target.value)}
                className={inputCls}
                placeholder="https://your-cdn.com/logo.png"
              />
            </div>
          </div>
        </Card>

        {/* Labels */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-800 mb-4">Custom Labels</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'challengesSingular', label: 'Challenge (singular)' },
              { key: 'challengesPlural',   label: 'Challenge (plural)' },
              { key: 'pointsLabel',        label: 'Points label' },
              { key: 'memberLabel',        label: 'Member label' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input
                  value={(config.labels as any)[key] || ''}
                  onChange={e => updateLabel(key, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Feature Flags */}
        <Card padding="md">
          <h3 className="font-semibold text-slate-800 mb-4">Feature Flags</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(config.features).map(([key, enabled]) => (
              <label
                key={key}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${
                  enabled
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-sm font-medium text-slate-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div
                  className={`w-10 h-5 rounded-full transition-colors ${
                    enabled ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                  onClick={() => updateFeature(key, !enabled)}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </label>
            ))}
          </div>
        </Card>

      </form>

      {/* Preview Modal */}
      <Modal
        open={preview}
        onClose={() => setPreview(false)}
        title="Config Preview"
        width="lg"
      >
        <div className="space-y-4">
          {/* Branding preview */}
          <div
            className="rounded-xl p-6 text-white text-center"
            style={{ background: config.branding.primaryColor }}
          >
            <p className="text-2xl font-bold">{config.branding.appName}</p>
            <p className="text-sm opacity-80 mt-1">
              {config.labels.challengesPlural} · {config.labels.pointsLabel}
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: config.branding.accentColor }}
          >
            <p className="text-white font-semibold">Accent Color</p>
          </div>
          {/* Active features */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-2">Enabled Features:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(config.features)
                .filter(([, v]) => v)
                .map(([k]) => (
                  <span key={k} className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-medium capitalize">
                    {k.replace(/([A-Z])/g,' $1').trim()}
                  </span>
                ))
              }
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}