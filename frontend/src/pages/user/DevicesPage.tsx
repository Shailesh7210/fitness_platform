import { useEffect, useState }    from 'react';
import {
  Smartphone, Wifi, WifiOff,
  RefreshCw, AlertCircle, CheckCircle2,
} from 'lucide-react';
import toast                      from 'react-hot-toast';
import { api }                    from '../../api/client';
import { UserLayout }             from '../../components/layout/UserLayout';
import { Card }                   from '../../components/ui/Card';
import { Badge }                  from '../../components/ui/Badge';
import { Modal }                  from '../../components/ui/Modal';
import { Spinner }                from '../../components/ui/Spinner';
import type { DeviceIntegration } from '../../types';

const PLATFORM_INFO: Record<string, { label: string; color: string }> = {
  fitbit:       { label: 'Fitbit',       color: 'bg-teal-500'  },
  garmin:       { label: 'Garmin',       color: 'bg-blue-600'  },
  apple_health: { label: 'Apple Health', color: 'bg-red-500'   },
  google_fit:   { label: 'Google Fit',   color: 'bg-green-500' },
  whoop:        { label: 'Whoop',        color: 'bg-slate-800' },
};

const statusColor: Record<string, 'green' | 'gray' | 'red' | 'yellow'> = {
  connected:    'green',
  disconnected: 'gray',
  error:        'red',
  syncing:      'yellow',
};

export function DevicesPage() {
  const [devices,      setDevices]      = useState<DeviceIntegration[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState<string | null>(null);
  const [connectModal, setConnectModal] = useState<string | null>(null);
  const [token,        setToken]        = useState('');
  const [saving,       setSaving]       = useState(false);

  // ── Load devices ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/api/devices');
        setDevices(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Helper: refresh device list ──────────────────────────────────
  async function refreshDevices() {
    try {
      const res = await api.get('/api/devices');
      setDevices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Connect ──────────────────────────────────────────────────────
  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectModal) return;
    setSaving(true);
    try {
      await api.post(`/api/devices/${connectModal}/connect`, {
        accessToken: token,
      });
      toast.success(`${PLATFORM_INFO[connectModal]?.label} connected!`);
      setConnectModal(null);
      setToken('');
      await refreshDevices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to connect');
    } finally {
      setSaving(false);
    }
  }

  // ── Disconnect ───────────────────────────────────────────────────
  async function handleDisconnect(platform: string) {
    try {
      await api.delete(`/api/devices/${platform}/disconnect`);
      toast.success('Device disconnected');
      await refreshDevices();
    } catch {
      toast.error('Failed to disconnect');
    }
  }

  // ── Sync ─────────────────────────────────────────────────────────
  async function handleSync(platform: string) {
    setSyncing(platform);
    try {
      await api.post(`/api/devices/${platform}/sync`);
      toast.success('Sync started!');
      setTimeout(async () => {
        await refreshDevices();
        setSyncing(null);
      }, 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed');
      setSyncing(null);
    }
  }

  // ── Retry ────────────────────────────────────────────────────────
  async function handleRetry(platform: string) {
    try {
      await api.post(`/api/devices/${platform}/retry`);
      toast.success('Retrying connection...');
      await refreshDevices();
    } catch {
      toast.error('Retry failed');
    }
  }

  if (loading) {
    return (
      <UserLayout title="Device Integrations">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Device Integrations">
      <div className="space-y-6">

        {/* Header banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
          <h2 className="text-xl font-bold mb-1">Connect Your Devices</h2>
          <p className="text-slate-300 text-sm">
            Sync your wearables to automatically update your challenge
            progress and activity data.
          </p>
        </div>

        {/* Device cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map(device => {
            const info        = PLATFORM_INFO[device.platform];
            const isConnected = device.status === 'connected' || device.status === 'syncing';
            const isSyncing   = syncing === device.platform   || device.status === 'syncing';

            return (
              <Card
                key={device.platform}
                padding="md"
                className="hover:shadow-md transition-shadow"
              >
                {/* Platform header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${info?.color || 'bg-slate-500'} flex items-center justify-center`}>
                    <Smartphone size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{info?.label}</p>
                    <Badge
                      variant={statusColor[device.status] || 'gray'}
                      className="capitalize mt-0.5"
                    >
                      {isSyncing ? 'Syncing...' : device.status}
                    </Badge>
                  </div>
                  {isConnected
                    ? <CheckCircle2 size={20} className="text-green-500" />
                    : <WifiOff      size={20} className="text-slate-300" />
                  }
                </div>

                {/* Last sync */}
                {device.lastSyncAt && (
                  <p className="text-xs text-slate-400 mb-3">
                    Last synced: {new Date(device.lastSyncAt).toLocaleString()}
                  </p>
                )}

                {/* Error message */}
                {device.errorMessage && (
                  <div className="flex items-start gap-2 mb-3 p-2 bg-red-50 rounded-lg">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600">{device.errorMessage}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  {!isConnected ? (
                    <button
                      onClick={() => setConnectModal(device.platform)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                    >
                      <Wifi size={13} /> Connect
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSync(device.platform)}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(device.platform)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                      >
                        <WifiOff size={13} /> Disconnect
                      </button>
                    </>
                  )}

                  {device.status === 'error' && (
                    <button
                      onClick={() => handleRetry(device.platform)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-xs font-medium hover:bg-yellow-100 transition"
                    >
                      <RefreshCw size={13} /> Retry
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connect Modal */}
      <Modal
        open={!!connectModal}
        onClose={() => { setConnectModal(null); setToken(''); }}
        title={`Connect ${connectModal ? PLATFORM_INFO[connectModal]?.label : ''}`}
      >
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            In a real integration you would be redirected to{' '}
            {PLATFORM_INFO[connectModal || '']?.label} to authorise. For now,
            enter any token to simulate a connection.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Access Token
            </label>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter access token..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Connecting...' : 'Connect Device'}
          </button>
        </form>
      </Modal>
    </UserLayout>
  );
}