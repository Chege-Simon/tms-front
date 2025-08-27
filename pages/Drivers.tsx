


import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Driver, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

interface DriverFormData {
  id?: string | number;
  name: string;
  national_id: string;
  phone: string;
  vehicle_id: string | number;
  metadata?: string;
}

const emptyDriverForm: DriverFormData = { name: '', national_id: '', phone: '', vehicle_id: '', metadata: '{}' };

const Drivers: React.FC = () => {
  const { items: drivers, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Driver>('/drivers');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<DriverFormData>(emptyDriverForm);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/drivers?search=${encodeURIComponent(searchTerm)}` : '/drivers';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<Driver>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Name', accessor: 'name' },
    { header: 'National ID', accessor: 'national_id' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Assigned Vehicle', accessor: (d) => d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.registration_number})` : 'N/A' },
  ], []);

  const handleEdit = (driver: Driver) => {
    setCurrentItem({
      id: driver.id,
      name: driver.name,
      national_id: driver.national_id,
      phone: driver.phone,
      vehicle_id: driver.vehicle.id,
      metadata: driver.metadata || '{}',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    const initialDriver = { ...emptyDriverForm, vehicle_id: vehicles?.[0]?.id || '' };
    setCurrentItem(initialDriver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
        deleteItem(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The form state (currentItem) is in the shape the API expects for POST/PUT.
    // We cast to `any` because the generic `useCrud` hook is typed against the GET response shape (`Driver`).
    if (currentItem.id) {
      await updateItem(currentItem as any);
    } else {
      await addItem(currentItem as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      <Header title="Drivers">
        <Button onClick={handleAddNew} disabled={vehiclesLoading}>
          <PlusIcon />
          Add Driver
        </Button>
      </Header>
      <div className="mb-4">
        <Input 
            label="Search Drivers"
            id="search"
            placeholder="Search by name, national ID, phone, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={drivers}
        isLoading={loading || vehiclesLoading}
        error={error}
        renderActions={(driver) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(driver)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(driver.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Name" id="name" name="name" value={currentItem.name} onChange={handleChange} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="National ID" id="national_id" name="national_id" value={currentItem.national_id} onChange={handleChange} required />
            <Input label="Phone" id="phone" name="phone" value={currentItem.phone} onChange={handleChange} required />
          </div>
          <Select label="Assigned Vehicle" id="vehicle_id" name="vehicle_id" value={currentItem.vehicle_id} onChange={handleChange} required disabled={vehiclesLoading}>
            <option value="">Select a vehicle</option>
            {vehicles?.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration_number})</option>)}
          </Select>
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

export default Drivers;