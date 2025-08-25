import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useCrud } from '../hooks/useCrud';
import type { Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyCustomer: Omit<Customer, 'id'> = { name: '', email: '', phone: '', address: '' };

const Customers: React.FC = () => {
  const { items: customers, addItem, updateItem, deleteItem, loading, error } = useCrud<Customer>('/customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Customer | Omit<Customer, 'id'>>(emptyCustomer);

  const columns: Column<Customer>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
  ], []);

  const handleEdit = (customer: Customer) => {
    setCurrentItem(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem(emptyCustomer);
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
      <Header title="Customers">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add Customer
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={customers}
        isLoading={loading}
        error={error}
        renderActions={(customer) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(customer)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(customer.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={currentItem.email} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={currentItem.phone} onChange={handleChange} required />
          <Input label="Address" name="address" value={currentItem.address} onChange={handleChange} required />
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Customers;