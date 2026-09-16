import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import StaffModal from './StaffModal';
import { UserCheck, Plus, Trash2, Mail, Phone, ShieldCheck, User } from 'lucide-react';

export const StaffList = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('STAFF');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await authService.getUsers({
        role: roleFilter || undefined,
      });
      const list = Array.isArray(data) ? data : data.results || [];
      // If roleFilter is empty, show STAFF and ADMIN by default
      const filtered = roleFilter ? list : list.filter(u => u.role === 'STAFF' || u.role === 'ADMIN');
      setUsers(filtered);
    } catch (err) {
      console.error(err);
      addToast('Failed to load team directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) {
      addToast('You cannot delete your own logged-in administrator account.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to remove staff member "${name}"? They will no longer be able to log in.`)) {
      try {
        await authService.deleteUser(id);
        addToast(`Staff member ${name} removed`, 'info');
        fetchUsers();
      } catch (err) {
        addToast('Failed to delete staff member', 'error');
      }
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <img
              src={row.avatar}
              alt={row.full_name}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {row.first_name?.[0] || 'S'}{row.last_name?.[0] || 'M'}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{row.full_name}</span>
              {row.id === currentUser?.id && (
                <span className="text-[10px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-semibold">You</span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{row.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role & Department',
      render: (row) => (
        <div>
          {row.role === 'ADMIN' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Administrator</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800">
              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Staff Member</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      render: (row) => (
        <div className="text-xs text-slate-600 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.phone || 'Not provided'}</span>
        </div>
      ),
    },
    {
      header: 'Joined Date',
      render: (row) => (
        <span className="text-xs text-slate-500 font-mono">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.id !== currentUser?.id && (
            <button
              onClick={() => handleDelete(row.id, row.full_name)}
              title="Remove Staff"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            <span>Staff & Team Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer veterinary doctors, caretakers, groomers, and facility staff credentials
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Staff Member</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search staff by name, email, or phone..."
        filterComponent={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Team (Staff & Admins)</option>
            <option value="STAFF">Staff Only</option>
            <option value="ADMIN">Administrators Only</option>
          </select>
        }
      />

      {isModalOpen && (
        <StaffModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
};

export default StaffList;
