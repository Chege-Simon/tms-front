
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { RouteCharge, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

// This interface defines the shape of the data for the form,
// which is slightly different from the data received from the API (which has a nested vehicle_type object).
interface RouteChargeFormData {
  id?: string | number;
  route: string;
  vehicle_type_id: string | number;
  charge: number;
  metadata?: string;
}

const emptyRouteChargeForm: Omit<RouteChargeFormData, 'id'> = { route: '', vehicle_type_id: '', charge: 0, metadata: '{}' };

const RouteCharges: React.FC = () => {
  const { items: routeCharges, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<RouteCharge>('/route_charges');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<RouteChargeFormData>(emptyRouteChargeForm);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/route_charges?search=${encodeURIComponent(searchTerm)}` : '/route_charges';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<RouteCharge>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Route', accessor: 'route' },
    { header: 'Vehicle Type', accessor: (rc) => rc.vehicle_type?.name || 'N/A' },
    { header: 'Charge', accessor: (rc) => `$${rc.charge.toFixed(2)}` },
  ], []);

  const handleEdit = (routeCharge: RouteCharge) => {
    setCurrentItem({
      id: routeCharge.id,
      route: routeCharge.route,
      charge: routeCharge.charge,
      // Use the id from the nested object if available, otherwise use the direct id
      vehicle_type_id: routeCharge.vehicle_type?.id || routeCharge.vehicle_type_id,
      metadata: routeCharge.metadata || '{}',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    // Pre-select the first vehicle type if available
    const initialItem = { ...emptyRouteChargeForm, vehicle_type_id: vehicleTypes?.[0]?.id || '' };
    setCurrentItem(initialItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem.id) {
      // The API expects a flat object for updates, so we send our form state `currentItem`.
      // We cast to `any` because `updateItem` is typed against the GET response shape.
      await updateItem(currentItem as any);
    } else {
      await addItem(currentItem as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name === 'charge' ? parseFloat(value) || 0 : value,
    }));
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
      <Header title="Route Charges">
        <Button onClick={handleAddNew} disabled={vehicleTypesLoading}>
            <PlusIcon />
            Add Route Charge
        </Button>
      </Header>
       <div className="mb-4">
        <Input 
            label="Search Route Charges"
            id="search"
            placeholder="Search by route, code, or vehicle type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={routeCharges}
        isLoading={loading || vehicleTypesLoading}
        error={error}
        renderActions={(routeCharge) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(routeCharge)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(routeCharge.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Route Charge' : 'Add Route Charge'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Route" id="route" name="route" value={currentItem.route} onChange={handleChange} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select label="Vehicle Type" id="vehicle_type_id" name="vehicle_type_id" value={currentItem.vehicle_type_id} onChange={handleChange} required disabled={vehicleTypesLoading}>
                <option value="">Select a type</option>
                {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
            </Select>
            <Input label="Charge" id="charge" name="charge" type="number" step="0.01" value={currentItem.charge} onChange={handleChange} required />
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

export default RouteCharges;