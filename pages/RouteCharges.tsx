import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useCrud } from '../hooks/useCrud';
import type { RouteCharge } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyRoute: Omit<RouteCharge, 'id'> = { name: '', start_location: '', end_location: '', distance: 0 };

const RouteCharges: React.FC = () => {
  const { items: routes, addItem, updateItem, deleteItem, loading, error } = useCrud<RouteCharge>('/route_charges');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<RouteCharge | Omit<RouteCharge, 'id'>>(emptyRoute);

  const columns: Column<RouteCharge>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Start Location', accessor: 'start_location' },
    { header: 'End Location', accessor: 'end_location' },
    { header: 'Distance (km)', accessor: 'distance' },
  ], []);

  const handleEdit = (route: RouteCharge) => {
    setCurrentItem(route);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    setCurrentItem(emptyRoute);
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
    setCurrentItem(prev => ({ ...prev, [name]: name === 'distance' ? parseFloat(value) : value }));
  };

  return (
    <>
      <Header title="Route Charges">
        <Button onClick={handleAddNew}>
            <PlusIcon />
            Add Route Charge
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={routes}
        isLoading={loading}
        error={error}
        renderActions={(route) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(route)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(route.id)}><DeleteIcon /></Button>
          </>
        )}
      />
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Route Charge' : 'Add Route Charge'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Start Location" name="start_location" value={currentItem.start_location} onChange={handleChange} required />
          <Input label="End Location" name="end_location" value={currentItem.end_location} onChange={handleChange} required />
          <Input label="Distance (km)" name="distance" type="number" value={currentItem.distance} onChange={handleChange} required />
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default RouteCharges;
