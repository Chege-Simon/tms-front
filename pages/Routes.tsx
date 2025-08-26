
import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
// FIX: Import 'Select' and 'useFetch' to handle vehicle types.
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
// FIX: Import 'VehicleType' to use with vehicle type data.
import type { RouteCharge, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

// FIX: Renamed and redefined the empty state object to match the 'RouteCharge' type and its form data requirements.
const emptyRouteCharge: Omit<RouteCharge, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'> = { route: '', charge: 0, vehicle_type_id: '' };

const RouteCharges: React.FC = () => {
  // FIX: Renamed 'routes' to 'routeCharges' for clarity and consistency.
  const { items: routeCharges, addItem, updateItem, deleteItem, loading, error } = useCrud<RouteCharge>('/route_charges');
  // FIX: Fetch vehicle types to populate the dropdown in the form.
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // FIX: Updated state to hold 'RouteCharge' data, matching the corrected empty state object.
  const [currentItem, setCurrentItem] = useState<RouteCharge | Omit<RouteCharge, 'id' | 'created_at' | 'updated_at' | 'code' | 'vehicle_type'>>(emptyRouteCharge);

  // FIX: Updated column definitions to display correct properties from the 'RouteCharge' type.
  const columns: Column<RouteCharge>[] = useMemo(() => [
    { header: 'Route', accessor: 'route' },
    { header: 'Charge', accessor: (rc) => `$${rc.charge.toFixed(2)}` },
    { header: 'Vehicle Type', accessor: (rc) => rc.vehicle_type?.name || 'N/A' },
  ], []);

  const handleEdit = (route: RouteCharge) => {
    setCurrentItem(route);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    // FIX: Pre-select the first vehicle type when adding a new route charge.
    setCurrentItem({ ...emptyRouteCharge, vehicle_type_id: vehicleTypes?.[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The API expects a flat object, so we ensure the nested vehicle_type object is not sent.
    const itemToSubmit = { ...currentItem };
    delete (itemToSubmit as Partial<RouteCharge>).vehicle_type;

    if ('id' in itemToSubmit) {
      await updateItem(itemToSubmit);
    } else {
      await addItem(itemToSubmit);
    }
    handleCloseModal();
  };

  // FIX: Updated handleChange to handle both input and select elements, and to correctly parse the 'charge' value.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: name === 'charge' ? parseFloat(value) || 0 : value }));
  };

  return (
    <>
      <Header title="Route Charges">
        {/* FIX: Disable button while vehicle types are loading to prevent errors. */}
        <Button onClick={handleAddNew} disabled={vehicleTypesLoading}>
            <PlusIcon />
            Add Route Charge
        </Button>
      </Header>
      <DataTable
        columns={columns}
        // FIX: Renamed data prop for clarity.
        data={routeCharges}
        // FIX: The loading state should account for both route charges and vehicle types fetching.
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
        {/* FIX: Updated form to include fields for 'route', 'charge', and 'vehicle_type_id' to match the 'RouteCharge' type. */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Route" name="route" value={currentItem.route} onChange={handleChange} required />
          <Input label="Charge" name="charge" type="number" step="0.01" value={currentItem.charge} onChange={handleChange} required />
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
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default RouteCharges;
