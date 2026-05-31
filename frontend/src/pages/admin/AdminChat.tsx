import { useEffect, useState }  from 'react';
import { MessageCircle, Flag, Eye } from 'lucide-react';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';

interface SessionSummary {
  userId:       string;
  userName:     string;
  email:        string;
  messageCount: number;
  flaggedCount: number;
  lastMessage:  string;
  updatedAt:    string;
}

interface FlaggedMessage {
  userId:    string;
  userName:  string;
  email:     string;
  role:      string;
  content:   string;
  createdAt: string;
}

function getTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function AdminChat() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [flagged,  setFlagged]  = useState<FlaggedMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'sessions'|'flagged'>('sessions');
  const [detail,   setDetail]   = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sessRes, flagRes] = await Promise.all([
          api.get('/api/admin/chat/sessions'),
          api.get('/api/admin/chat/flagged'),
        ]);
        setSessions(sessRes.data || []);
        setFlagged(flagRes.data  || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function viewSession(userId: string) {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/admin/chat/sessions/${userId}`);
      setDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <AdminLayout title="Chat Logs">
      <div className="space-y-5">

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {(['sessions','flagged'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                tab === t
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'sessions' ? 'All Sessions' : `Flagged (${flagged.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : tab === 'sessions' ? (
          // ── Sessions table ────────────────────────────────────────
          <Card padding="none">
            {sessions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No chat sessions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['User','Email','Messages','Flagged','Last Message','Last Active','Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.userId} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {s.userName.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800">{s.userName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.email}</td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{s.messageCount}</td>
                        <td className="px-4 py-3">
                          {s.flaggedCount > 0 ? (
                            <Badge variant="red">{s.flaggedCount} flagged</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                          {s.lastMessage}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {getTimestamp(s.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => viewSession(s.userId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-medium hover:bg-blue-100 transition"
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          // ── Flagged messages ──────────────────────────────────────
          <div className="space-y-3">
            {flagged.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <Flag size={40} className="mx-auto text-green-200 mb-3" />
                <p className="text-slate-400 text-sm">No flagged messages</p>
              </Card>
            ) : (
              flagged.map((msg, i) => (
                <Card key={i} padding="md" className="border-red-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{msg.userName}</p>
                      <p className="text-xs text-slate-400">{msg.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={msg.role === 'user' ? 'blue' : 'purple'} className="capitalize">
                        {msg.role}
                      </Badge>
                      <span className="text-xs text-slate-400">{getTimestamp(msg.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                    <Flag size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{msg.content}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <Modal
        open={!!detail || loadingDetail}
        onClose={() => setDetail(null)}
        title="Chat Session"
        width="lg"
      >
        {loadingDetail ? (
          <div className="py-10"><Spinner className="mx-auto" /></div>
        ) : detail ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {detail.messages?.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No messages</p>
            ) : (
              detail.messages?.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                  } ${msg.flagged ? 'ring-2 ring-red-400' : ''}`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {getTimestamp(msg.createdAt)}
                      {msg.flagged && ' ⚠ flagged'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </Modal>
    </AdminLayout>
  );
}