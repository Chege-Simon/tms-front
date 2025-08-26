
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { useCrud } from '../hooks/useCrud';
import type { Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import CountrySelect from '../components/CountrySelect';

const emptyCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = { name: '', phone: '', address: '', location: '', country: '', metadata: '{}' };

const Customers: React.FC = () => {
  const { items: customers, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Customer>('/customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Customer | Omit<Customer, 'id' | 'created_at' | 'updated_at'>>(emptyCustomer);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/customers?search=${encodeURIComponent(searchTerm)}` : '/customers';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);


  const columns: Column<Customer>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Name', accessor: 'name' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
    { header: 'Location', accessor: 'location' },
    { header: 'Country', accessor: 'country' },
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
      await addItem(currentItem as Omit<Customer, 'id' | 'created_at' | 'updated_at'>);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      <Header title="Customers">
        <Button onClick={handleAddNew}>
          <PlusIcon />
          Add Customer
        </Button>
      </Header>
      <div className="mb-4">
        <Input 
            label="Search Customers"
            id="search"
            placeholder="Search by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
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
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <Input label="Phone" id="phone" name="phone" value={currentItem.phone || ''} onChange={handleChange} />
          <Input label="Address" id="address" name="address" value={currentItem.address || ''} onChange={handleChange} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Location" id="location" name="location" value={currentItem.location || ''} onChange={handleChange} />
            <CountrySelect value={currentItem.country || ''} onChange={handleChange} />
          </div>
          <Textarea label="Metadata (JSON)" id="metadata" name="metadata" value={currentItem.metadata || ''} onChange={handleChange} rows={3} />
          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Customers;