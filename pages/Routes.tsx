
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

// FIX: Define a separate interface for form state to handle numeric charge values, which differs from the string-based API response type.
interface RouteChargeFormData {
  id?: string | number;
  route: string;
  trip_charge: number;
  driver_wage: number;
  loading_charge: number;
  vehicle_type_id: string | number;
  metadata?: string;
}

// FIX: Initialize form state with numeric values and metadata, matching the form data interface. This resolves type errors.
const emptyRouteCharge: Omit<RouteChargeFormData, 'id'> = { route: '', trip_charge: 0, driver_wage: 0, loading_charge: 0, vehicle_type_id: '', metadata: '{}' };


const RouteCharges: React.FC = () => {
  const { items: routeCharges, addItem, updateItem, deleteItem, loading, error } = useCrud<RouteCharge>('/route_charges');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // FIX: Use the dedicated form data interface for the component's state to prevent type conflicts.
  const [currentItem, setCurrentItem] = useState<RouteChargeFormData>(emptyRouteCharge);

  const columns: Column<RouteCharge>[] = useMemo(() => [
    { header: 'Route', accessor: 'route' },
    // FIX: Parse string charge values from the API to numbers before calling toFixed() to prevent runtime errors.
    { header: 'Trip Charge', accessor: (rc) => `$${parseFloat(rc.trip_charge || '0').toFixed(2)}` },
    { header: 'Driver Wage', accessor: (rc) => `$${parseFloat(rc.driver_wage || '0').toFixed(2)}` },
    { header: 'Loading Charge', accessor: (rc) => `$${parseFloat(rc.loading_charge || '0').toFixed(2)}` },
    { header: 'Vehicle Type', accessor: (rc) => rc.vehicle_type?.name || 'N/A' },
  ], []);

  const handleEdit = (route: RouteCharge) => {
    // FIX: Convert string-based API data to number-based form data upon editing to ensure form inputs work correctly.
    setCurrentItem({
      id: route.id,
      route: route.route,
      trip_charge: parseFloat(route.trip_charge) || 0,
      driver_wage: parseFloat(route.driver_wage) || 0,
      loading_charge: parseFloat(route.loading_charge) || 0,
      vehicle_type_id: route.vehicle_type_id,
      metadata: route.metadata || '{}',
    });
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
    // The form state (currentItem) may differ from the API's expected type (RouteCharge).
    // Cast to `any` because `useCrud` is strictly typed against the API response shape.
    if ('id' in currentItem && currentItem.id) {
      await updateItem(currentItem as any);
    } else {
      await addItem(currentItem as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['trip_charge', 'driver_wage', 'loading_charge'];
    // FIX: Ensure charge values are stored as numbers in the form state.
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
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Route Charge' : 'Add Route Charge'}>
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
          {/* FIX: The metadata property now exists on the form data type, resolving the error. */}
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

export default RouteCharges;