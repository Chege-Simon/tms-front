


import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Vehicle, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyVehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'> = { brand: '', model: '', chassis_number: '', registration_number: '', vehicle_type_id: '', metadata: '{}' };

const Vehicles: React.FC = () => {
  const { items: vehicles, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Vehicle>('/vehicles');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Vehicle | Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'>>(emptyVehicle);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/vehicles?search=${encodeURIComponent(searchTerm)}` : '/vehicles';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<Vehicle>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Reg. Number', accessor: 'registration_number' },
    { header: 'Brand', accessor: 'brand' },
    { header: 'Model', accessor: 'model' },
    { header: 'Vehicle Type', accessor: (v) => v.vehicle_type?.name || 'N/A' },
  ], []);

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentItem(vehicle);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    const initialVehicle = { ...emptyVehicle, vehicle_type_id: vehicleTypes?.[0]?.id || '' };
    setCurrentItem(initialVehicle);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
        deleteItem(id);
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
      <Header title="Vehicles">
        <Button onClick={handleAddNew} disabled={vehicleTypesLoading}>
          <PlusIcon />
          Add Vehicle
        </Button>
      </Header>
      <div className="mb-4">
        <Input 
            label="Search Vehicles"
            id="search"
            placeholder="Search by code, reg number, chassis number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={loading || vehicleTypesLoading}
        error={error}
        renderActions={(vehicle) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(vehicle)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(vehicle.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Brand" id="brand" name="brand" value={currentItem.brand} onChange={handleChange} />
            <Input label="Model" id="model" name="model" value={currentItem.model || ''} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Registration Number" id="registration_number" name="registration_number" value={currentItem.registration_number} onChange={handleChange} required />
            <Input label="Chassis Number" id="chassis_number" name="chassis_number" value={currentItem.chassis_number} onChange={handleChange} required />
          </div>
          <Select label="Vehicle Type" id="vehicle_type_id" name="vehicle_type_id" value={currentItem.vehicle_type_id} onChange={handleChange} required>
            <option value="">Select a type</option>
            {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
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

export default Vehicles;