
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

  // FIX: Switched to direct property access for numeric fields to ensure type safety.
  // TypeScript was unable to correctly infer the type of `updated[name]` within the switch statement.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => {
      const updated = { ...prev };
      switch (name) {
        case 'make':
        case 'model':
        case 'vin':
        case 'license_plate':
          updated[name] = value;
          break;
        case 'year':
          updated.year = parseInt(value, 10) || 0;
          break;
        case 'vehicle_type_id':
          updated.vehicle_type_id = parseInt(value, 10) || 0;
          break;
      }
      return updated;
    });
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Make" id="make" name="make" value={currentItem.make} onChange={handleChange} required />
            <Input label="Model" id="model" name="model" value={currentItem.model} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Year" id="year" name="year" type="number" value={currentItem.year} onChange={handleChange} required />
            <Input label="License Plate" id="license_plate" name="license_plate" value={currentItem.license_plate} onChange={handleChange} required />
          </div>
          <Input label="VIN" id="vin" name="vin" value={currentItem.vin} onChange={handleChange} required />
          <Select label="Vehicle Type" id="vehicle_type_id" name="vehicle_type_id" value={currentItem.vehicle_type_id} onChange={handleChange} required>
            <option value="">Select a type</option>
            {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
          </Select>
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
