
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useCrud } from '../hooks/useCrud';
import type { Driver } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyDriver: Omit<Driver, 'id'> = { name: '', license_number: '', phone: '', email: '' };

const Drivers: React.FC = () => {
  const { items: drivers, addItem, updateItem, deleteItem, loading, error } = useCrud<Driver>('/drivers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Driver | Omit<Driver, 'id'>>(emptyDriver);

  const columns: Column<Driver>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'License Number', accessor: 'license_number' },
  ], []);

  const handleEdit = (driver: Driver) => {
    setCurrentItem(driver);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem(emptyDriver);
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
      <Header title="Drivers">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add Driver
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={drivers}
        isLoading={loading}
        error={error}
        renderActions={(driver) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(driver)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(driver.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Email" id="email" name="email" type="email" value={currentItem.email} onChange={handleChange} required />
            <Input label="Phone" id="phone" name="phone" value={currentItem.phone} onChange={handleChange} required />
          </div>
          <Input label="License Number" id="license_number" name="license_number" value={currentItem.license_number} onChange={handleChange} required />
          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Drivers;
