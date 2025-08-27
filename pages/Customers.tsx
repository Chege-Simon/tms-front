
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { useCrud } from '../hooks/useCrud';
import type { Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import CountrySelect from '../components/CountrySelect';
import FilterPopover from '../components/FilterPopover';

const emptyCustomer: Omit<Customer, 'id' | 'created_at' | 'updated_at'> = { name: '', phone: '', address: '', location: '', country: '', metadata: '{}' };

interface CustomerFilters {
  country: string;
}

const Customers: React.FC = () => {
  const { items: customers, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Customer>('/customers');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer['id'] | null>(null);
  const [currentItem, setCurrentItem] = useState<Customer | Omit<Customer, 'id' | 'created_at' | 'updated_at'>>(emptyCustomer);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerFilters>({ country: '' });

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (filters.country) {
        params.append('country', filters.country);
      }
      const queryString = params.toString();
      const url = `/customers${queryString ? `?${queryString}` : ''}`;
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, debouncedRefetch]);


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
  
  const handleDelete = (id: string | number) => {
    setCustomerToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
        await deleteItem(customerToDelete);
        setCustomerToDelete(null);
        setIsConfirmModalOpen(false);
    }
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
      <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Customers"
              id="search"
              placeholder="Search by name, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 self-end">
          <FilterPopover onFilter={setFilters} initialFilters={filters}>
            {(tempFilters, setTempFilters) => (
              <CountrySelect
                value={tempFilters.country}
                onChange={(e) => setTempFilters({ ...tempFilters, country: e.target.value })}
              />
            )}
          </FilterPopover>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={customers}
        isLoading={loading}
        error={error}
        renderActions={(customer) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(customer)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(customer.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this customer? This action cannot be undone."
      />
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
