'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { UserModal } from '@/components/modals/UserModal';
import { fetchFromApi } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Shield, UserCheck, UserX, Edit3 } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFromApi('/users');
      setUsers(data.data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadUsers();
    }
  }, [currentUser]);

  const handleSaveUser = async (formData) => {
    setError(null);
    try {
      if (userToEdit) {
        await fetchFromApi(`/users/${userToEdit.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            email: formData.email,
            fullName: formData.fullName,
            role: formData.role,
            isActive: formData.isActive,
          }),
        });
        setSuccessMessage('User updated successfully.');
      } else {
        await fetchFromApi('/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMessage('User created successfully.');
      }
      setIsModalOpen(false);
      setUserToEdit(null);
      loadUsers();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    try {
      await fetchFromApi(`/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isActive: !targetUser.is_active,
        }),
      });
      setSuccessMessage(`User ${targetUser.is_active ? 'deactivated' : 'reactivated'} successfully.`);
      loadUsers();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <Layout>
        <PageHeader title="Access Denied" description="Administrator privileges required." />
        <ErrorMessage title="Forbidden" message="You do not have administrative access to view user management." />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="User Management" 
        description="Manage staff accounts, roles, and access permissions."
        action={
          <Button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }} className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </Button>
        }
      />

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {error && <div className="mb-6"><ErrorMessage title="Action Failed" message={error} /></div>}

      {loading ? (
        <Loading message="Loading system users..." />
      ) : (
        <Table headers={['Username', 'Full Name', 'Email', 'Role', 'Status', 'Actions']}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-semibold text-navy-900">{u.username}</td>
              <td className="px-6 py-4">{u.full_name}</td>
              <td className="px-6 py-4 text-slate-500">{u.email}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <Shield className="w-3 h-3" />
                  <span>{u.role}</span>
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {u.is_active ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td className="px-6 py-4 space-x-2">
                <button 
                  onClick={() => { setUserToEdit(u); setIsModalOpen(true); }}
                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Edit User"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleToggleStatus(u)}
                  className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  title={u.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                >
                  {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSaveUser} 
        userToEdit={userToEdit} 
      />
    </Layout>
  );
}