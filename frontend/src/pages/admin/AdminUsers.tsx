import { useEffect, useState }  from 'react';
import {
  Search, UserCheck, UserX,
  Trash2, Shield, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import type { User }            from '../../types';

interface UsersResponse {
  users:      User[];
  pagination: { total: number; page: number; pages: number; limit: number };
}

export function AdminUsers() {
  const [data,     setData]     = useState<UsersResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [role,     setRole]     = useState('');
  const [page,     setPage]     = useState(1);
  const [delModal, setDelModal] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page:  String(page),
          limit: '10',
        });
        if (search) params.set('search', search);
        if (role)   params.set('role',   role);
        const res = await api.get(`/api/admin/users?${params}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, role]);

  // ── Search on Enter ───────────────────────────────────────────────
  async function handleSearch() {
    setPage(1);
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '10' });
      if (search) params.set('search', search);
      if (role)   params.set('role',   role);
      const res = await api.get(`/api/admin/users?${params}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle role ───────────────────────────────────────────────────
  async function handleRoleToggle(user: User) {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    try {
      await api.patch(`/api/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setData(prev => prev ? {
        ...prev,
        users: prev.users.map(u =>
          u.id === user.id ? { ...u, role: newRole as 'admin' | 'member' } : u
        ),
      } : prev);
    } catch {
      toast.error('Failed to update role');
    }
  }

  // ── Toggle active status ──────────────────────────────────────────
  async function handleStatusToggle(user: User) {
    try {
      await api.patch(`/api/admin/users/${user.id}/status`, {
        isActive: !user.isActive,
      });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      setData(prev => prev ? {
        ...prev,
        users: prev.users.map(u =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        ),
      } : prev);
    } catch {
      toast.error('Failed to update status');
    }
  }

  // ── Delete user ───────────────────────────────────────────────────
  async function handleDelete() {
    if (!delModal) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/users/${delModal.id}`);
      toast.success('User deleted');
      setDelModal(null);
      setData(prev => prev ? {
        ...prev,
        users: prev.users.filter(u => u.id !== delModal.id),
        pagination: {
          ...prev.pagination,
          total: prev.pagination.total - 1,
        },
      } : prev);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  const users = data?.users || [];
  const pg    = data?.pagination;

  return (
    <AdminLayout title="Users">
      <div className="space-y-5">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>
          <div className="flex gap-2">
            {['', 'member', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => { setRole(r); setPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition ${
                  role === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {r === '' ? 'All Roles' : r}
              </button>
            ))}
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Total */}
        {pg && (
          <p className="text-sm text-slate-500">
            Showing {users.length} of {pg.total} users
          </p>
        )}

        {/* Table */}
        <Card padding="none">
          {loading ? (
            <div className="py-16"><Spinner className="mx-auto" /></div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['User','Email','Role','Status','Joined','Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr
                      key={user.id}
                      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${
                        i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <span className="font-medium text-slate-800">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'purple' : 'blue'} className="capitalize">
                          {user.role}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? 'green' : 'red'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Toggle role */}
                          <button
                            onClick={() => handleRoleToggle(user)}
                            title={user.role === 'admin' ? 'Make Member' : 'Make Admin'}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition"
                          >
                            <Shield size={15} />
                          </button>

                          {/* Toggle active */}
                          <button
                            onClick={() => handleStatusToggle(user)}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition ${
                              user.isActive
                                ? 'hover:bg-orange-50 text-slate-400 hover:text-orange-500'
                                : 'hover:bg-green-50  text-slate-400 hover:text-green-600'
                            }`}
                          >
                            {user.isActive
                              ? <UserX      size={15} />
                              : <UserCheck  size={15} />
                            }
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDelModal(user)}
                            title="Delete user"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {pg && pg.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {pg.page} of {pg.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 transition disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pg.pages, p + 1))}
                disabled={page === pg.pages}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 transition disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!delModal}
        onClose={() => setDelModal(null)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700">
              Are you sure you want to permanently delete{' '}
              <strong>{delModal?.firstName} {delModal?.lastName}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDelModal(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}