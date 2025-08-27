


import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import { useCrud } from '../hooks/useCrud';
import type { User } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { notifyError } from '../services/notification';

interface UserFormData extends Omit<User, 'id' | 'created_at' | 'updated_at'> {
  id?: string | number;
  password?: string;
  password_confirmation?: string;
}

const emptyUserForm: UserFormData = { name: '', email: '', password: '', password_confirmation: '' };

const Users: React.FC = () => {
  const { items: users, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<User>('/users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<User['id'] | null>(null);
  const [currentItem, setCurrentItem] = useState<UserFormData>(emptyUserForm);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      debouncedRefetch(`/users?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<User>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
  ], []);
  
  const handleEdit = (user: User) => {
    setCurrentItem({ ...user, password: '', password_confirmation: '' });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem(emptyUserForm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleDelete = (id: string | number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
        await deleteItem(itemToDelete);
        setItemToDelete(null);
        setIsConfirmModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem.password !== currentItem.password_confirmation) {
      notifyError('Passwords do not match.');
      return;
    }
    if (!currentItem.id && !currentItem.password) {
        notifyError('Password is required for new users.');
        return;
    }

    const payload: Partial<UserFormData> = { ...currentItem };
    if (currentItem.id && !currentItem.password) {
        delete payload.password;
        delete payload.password_confirmation;
    }

    if (currentItem.id) {
      await updateItem(payload as any);
    } else {
      await addItem(payload as any);
    }
    handleCloseModal();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };
  
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Showing {pagination.meta?.from ?? 0} to {pagination.meta?.to ?? 0} of {pagination.meta?.total ?? 0} results</span>
      <div className="space-x-2">
        <Button onClick={() => refetch(pagination.links?.prev)} disabled={!pagination.links?.prev || loading} variant="secondary">Previous</Button>
        <Button onClick={() => refetch(pagination.links?.next)} disabled={!pagination.links?.next || loading} variant="secondary">Next</Button>
      </div>
    </div>
  );

  return (
    <>
      <Header title="Users">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add User
        </Button>
      </Header>
       <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Users"
              id="search"
              placeholder="Search by name, email, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        error={error}
        renderActions={(user) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(user)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(user.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta?.total > 0 && <PaginationControls />}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Email" id="email" name="email" type="email" value={currentItem.email} onChange={handleChange} required />
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentItem.id ? 'Leave password fields blank to keep the current password.' : 'Password is required for new users.'}</p>
          <Input label="Password" id="password" name="password" type="password" value={currentItem.password || ''} onChange={handleChange} autoComplete="new-password" />
          <Input label="Confirm Password" id="password_confirmation" name="password_confirmation" type="password" value={currentItem.password_confirmation || ''} onChange={handleChange} />
          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Users;