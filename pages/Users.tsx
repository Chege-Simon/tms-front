
import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCrud } from '../hooks/useCrud';
import type { User } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const Users: React.FC = () => {
  const { items: users, deleteItem, loading, error } = useCrud<User>('/users');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<User['id'] | null>(null);

  const columns: Column<User>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
  ], []);
  
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

  return (
    <>
      <Header title="Users">
        <Button onClick={() => alert('Add new user functionality not implemented.')}>
          <PlusIcon />
          Add User
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        error={error}
        renderActions={(user) => (
          <>
            <Button variant="icon" onClick={() => alert('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(user.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </>
  );
};

export default Users;
