import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Vehicle, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const emptyVehicle: Omit<Vehicle, 'id'> = { make: '', model: '', year: new Date().getFullYear(), vin: '', license_plate: '', vehicle_type_id: 0 };

const Vehicles: React.FC = () => {
  const { items: vehicles, addItem, updateItem, deleteItem, loading, error } = useCrud<Vehicle>('/vehicles');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Vehicle | Omit<Vehicle, 'id'>>(emptyVehicle);

  const vehicleTypeMap = useMemo(() => {
    return vehicleTypes?.reduce((acc, vt) => {
      acc[vt.id] = vt.name;
      return acc;
    }, {} as Record<number, string>) || {};
  }, [vehicleTypes]);

  const columns: Column<Vehicle>[] = useMemo(() => [
    { header: 'Make', accessor: 'make' },
    { header: 'Model', accessor: 'model' },
    { header: 'Year', accessor: 'year' },
    { header: 'License Plate', accessor: 'license_plate' },
    { header: 'Vehicle Type', accessor: (v) => vehicleTypeMap[v.vehicle_type_id] || 'N/A' },
  ], [vehicleTypeMap]);

  const handleEdit = (vehicle: Vehicle) => {
    setCurrentItem(vehicle);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    const initialVehicle = { ...emptyVehicle, vehicle_type_id: vehicleTypes?.[0]?.id || 0 };
    setCurrentItem(initialVehicle);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['year', 'vehicle_type_id'].includes(name);
    setCurrentItem(prev => ({ ...prev, [name]: isNumeric ? parseInt(value) : value }));
  };

  return (
    <>
      <Header title="Vehicles">
        <Button onClick={handleAddNew} disabled={vehicleTypesLoading}>
          <PlusIcon />
          Add Vehicle
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={loading || vehicleTypesLoading}
        error={error}
        renderActions={(vehicle) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(vehicle)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(vehicle.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Make" name="make" value={currentItem.make} onChange={handleChange} required />
          <Input label="Model" name="model" value={currentItem.model} onChange={handleChange} required />
          <Input label="Year" name="year" type="number" value={currentItem.year} onChange={handleChange} required />
          <Input label="License Plate" name="license_plate" value={currentItem.license_plate} onChange={handleChange} required />
          <Input label="VIN" name="vin" value={currentItem.vin} onChange={handleChange} required />
          <Select label="Vehicle Type" name="vehicle_type_id" value={currentItem.vehicle_type_id} onChange={handleChange} required>
            <option value="">Select a type</option>
            {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
          </Select>
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Vehicles;