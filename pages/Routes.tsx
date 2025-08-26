
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { RouteCharge, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import Textarea from '../components/Textarea';


const emptyRouteCharge: Omit<RouteCharge, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'> = { route: '', trip_charge: 0, driver_wage: 0, loading_charge: 0, vehicle_type_id: '' };

const RouteCharges: React.FC = () => {
  const { items: routeCharges, addItem, updateItem, deleteItem, loading, error } = useCrud<RouteCharge>('/route_charges');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<RouteCharge | Omit<RouteCharge, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'>>(emptyRouteCharge);

  const columns: Column<RouteCharge>[] = useMemo(() => [
    { header: 'Route', accessor: 'route' },
    { header: 'Trip Charge', accessor: (rc) => `$${rc.trip_charge.toFixed(2)}` },
    { header: 'Driver Wage', accessor: (rc) => `$${rc.driver_wage.toFixed(2)}` },
    { header: 'Loading Charge', accessor: (rc) => `$${rc.loading_charge.toFixed(2)}` },
    { header: 'Vehicle Type', accessor: (rc) => rc.vehicle_type?.name || 'N/A' },
  ], []);

  const handleEdit = (route: RouteCharge) => {
    setCurrentItem(route);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    setCurrentItem({ ...emptyRouteCharge, vehicle_type_id: vehicleTypes?.[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemToSubmit = { ...currentItem };
    delete (itemToSubmit as Partial<RouteCharge>).vehicle_type;

    if ('id' in itemToSubmit) {
      await updateItem(itemToSubmit);
    } else {
      await addItem(itemToSubmit);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['trip_charge', 'driver_wage', 'loading_charge'];
    setCurrentItem(prev => ({ ...prev, [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value }));
  };

  return (
    <>
      <Header title="Route Charges">
        <Button onClick={handleAddNew} disabled={vehicleTypesLoading}>
            <PlusIcon />
            Add Route Charge
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={routeCharges}
        isLoading={loading || vehicleTypesLoading}
        error={error}
        renderActions={(route) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(route)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(route.id)}><DeleteIcon /></Button>
          </>
        )}
      />
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={'id' in currentItem ? 'Edit Route Charge' : 'Add Route Charge'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Route" id="route" name="route" value={currentItem.route} onChange={handleChange} required />
            <Select
              label="Vehicle Type"
              name="vehicle_type_id"
              id="vehicle_type_id"
              value={currentItem.vehicle_type_id}
              onChange={handleChange}
              required
              disabled={vehicleTypesLoading}
            >
              <option value="">Select a type</option>
              {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input label="Trip Charge" id="trip_charge" name="trip_charge" type="number" step="0.01" value={currentItem.trip_charge} onChange={handleChange} required />
            <Input label="Driver Wage" id="driver_wage" name="driver_wage" type="number" step="0.01" value={currentItem.driver_wage} onChange={handleChange} required />
            <Input label="Loading Charge" id="loading_charge" name="loading_charge" type="number" step="0.01" value={currentItem.loading_charge} onChange={handleChange} required />
          </div>
          <Textarea label="Metadata (JSON)" id="metadata" name="metadata" value={currentItem.metadata || ''} onChange={handleChange as any} rows={3} />
          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default RouteCharges;