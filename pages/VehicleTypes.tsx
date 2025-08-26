
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useCrud } from '../hooks/useCrud';
import type { VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyVehicleType: Omit<VehicleType, 'id'> = { name: '', description: '' };

const VehicleTypes: React.FC = () => {
  const { items: vehicleTypes, addItem, updateItem, deleteItem, loading, error } = useCrud<VehicleType>('/vehicle_types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<VehicleType | Omit<VehicleType, 'id'>>(emptyVehicleType);

  const columns: Column<VehicleType>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Description', accessor: 'description' },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ('id' in currentItem) {
      await updateItem(currentItem);
    } else {
      await addItem(currentItem);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Header title="Vehicle Types">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add Vehicle Type
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={vehicleTypes}
        isLoading={loading}
        error={error}
        renderActions={(vt) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(vt)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(vt.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Vehicle Type' : 'Add Vehicle Type'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Description" id="description" name="description" value={currentItem.description} onChange={handleChange} required />
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
