
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { useCrud } from '../hooks/useCrud';
import type { VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyVehicleType: Omit<VehicleType, 'id' | 'created_at' | 'updated_at' | 'code'> = { name: '', size: '', metadata: '{}' };

const VehicleTypes: React.FC = () => {
  const { items: vehicleTypes, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<VehicleType>('/vehicle_types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VehicleType['id'] | null>(null);
  const [currentItem, setCurrentItem] = useState<VehicleType | Omit<VehicleType, 'id' | 'created_at' | 'updated_at' | 'code'>>(emptyVehicleType);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/vehicle_types?search=${encodeURIComponent(searchTerm)}` : '/vehicle_types';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<VehicleType>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Name', accessor: 'name' },
    { header: 'Size', accessor: 'size' },
  ], []);

  const handleEdit = (vt: VehicleType) => {
    setCurrentItem(vt);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem(emptyVehicleType);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
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
    if ('id' in currentItem) {
      await updateItem(currentItem);
    } else {
      await addItem(currentItem);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
      <span>
        Showing {pagination.meta?.from ?? 0} to {pagination.meta?.to ?? 0} of {pagination.meta?.total ?? 0} results
      </span>
      <div className="space-x-2">
        <Button onClick={() => refetch(pagination.links?.prev)} disabled={!pagination.links?.prev || loading} variant="secondary">
          Previous
        </Button>
        <Button onClick={() => refetch(pagination.links?.next)} disabled={!pagination.links?.next || loading} variant="secondary">
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Header title="Vehicle Types">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add Vehicle Type
        </Button>
      </Header>
      <div className="mb-4">
        <Input 
            label="Search Vehicle Types"
            id="search"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={vehicleTypes}
        isLoading={loading}
        error={error}
        renderActions={(vt) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(vt)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(vt.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this vehicle type? This action cannot be undone."
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Vehicle Type' : 'Add Vehicle Type'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Size" id="size" name="size" value={currentItem.size || ''} onChange={handleChange} />
          <Textarea label="Metadata (JSON)" id="metadata" name="metadata" value={currentItem.metadata || '{}'} onChange={handleChange} rows={3} />
          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default VehicleTypes;
