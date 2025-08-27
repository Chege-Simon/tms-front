
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { RouteCharge, VehicleType } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

interface RouteChargeFormData {
  id?: string | number;
  route: string;
  vehicle_type_id: string | number;
  trip_charge: number;
  driver_wage: number;
  loading_charge: number;
}

const emptyRouteChargeForm: Omit<RouteChargeFormData, 'id'> = { route: '', vehicle_type_id: '', trip_charge: 0, driver_wage: 0, loading_charge: 0 };

const RouteCharges: React.FC = () => {
  const { items: routeCharges, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<RouteCharge>('/route_charges');
  const { data: vehicleTypes, loading: vehicleTypesLoading } = useFetch<VehicleType[]>('/vehicle_types');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RouteCharge['id'] | null>(null);
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
    { header: 'Trip Charge', accessor: (rc) => `KES ${parseFloat(rc.trip_charge || '0').toFixed(2)}` },
    { header: 'Driver Wage', accessor: (rc) => `KES ${parseFloat(rc.driver_wage || '0').toFixed(2)}` },
    { header: 'Loading Charge', accessor: (rc) => `KES ${parseFloat(rc.loading_charge || '0').toFixed(2)}` },
    { header: 'Total Charge', accessor: (rc) => `KES ${(parseFloat(rc.trip_charge || '0') + parseFloat(rc.driver_wage || '0') + parseFloat(rc.loading_charge || '0')).toFixed(2)}` },
  ], []);

  const handleEdit = (routeCharge: RouteCharge) => {
    setCurrentItem({
      id: routeCharge.id,
      route: routeCharge.route,
      trip_charge: parseFloat(routeCharge.trip_charge) || 0,
      driver_wage: parseFloat(routeCharge.driver_wage) || 0,
      loading_charge: parseFloat(routeCharge.loading_charge) || 0,
      vehicle_type_id: routeCharge.vehicle_type?.id || routeCharge.vehicle_type_id,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    const initialItem = { ...emptyRouteChargeForm, vehicle_type_id: vehicleTypes?.[0]?.id || '' };
    setCurrentItem(initialItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleDelete = (id: string | number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (itemToDelete) {
        await deleteItem(itemToDelete);
        setItemToDelete(null);
        setIsConfirmModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItem.id) {
      await updateItem(currentItem as any);
    } else {
      await addItem(currentItem as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['trip_charge', 'driver_wage', 'loading_charge'];
    setCurrentItem(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
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
            <Button variant="icon" onClick={() => handleDelete(routeCharge.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this route charge? This action cannot be undone."
      />
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Route Charge' : 'Add Route Charge'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input label="Route" id="route" name="route" value={currentItem.route} onChange={handleChange} required />
            <Select label="Vehicle Type" id="vehicle_type_id" name="vehicle_type_id" value={currentItem.vehicle_type_id} onChange={handleChange} required disabled={vehicleTypesLoading}>
                <option value="">Select a type</option>
                {vehicleTypes?.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input label="Trip Charge" id="trip_charge" name="trip_charge" type="number" step="0.01" value={currentItem.trip_charge} onChange={handleChange} required />
            <Input label="Driver Wage" id="driver_wage" name="driver_wage" type="number" step="0.01" value={currentItem.driver_wage} onChange={handleChange} required />
            <Input label="Loading Charge" id="loading_charge" name="loading_charge" type="number" step="0.01" value={currentItem.loading_charge} onChange={handleChange} required />
          </div>
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
