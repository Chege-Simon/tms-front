
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Invoice, Customer, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, EyeIcon } from '../components/icons';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Select from '../components/Select';
import Input from '../components/Input';
import api from '../services/api';
import { notifyError } from '../services/notification';
import FilterPopover from '../components/FilterPopover';

const InvoiceInitialCreateModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [formData, setFormData] = useState({
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer_id: '',
        vehicle_id: '',
        currency: 'KES',
        total_amount: 0,
    });

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [customerRes, vehicleRes]: any[] = await Promise.all([
                    api.get('/customers'),
                    api.get('/vehicles')
                ]);
                const customerData = customerRes?.data?.data || customerRes.data || customerRes || [];
                const vehicleData = vehicleRes?.data?.data || vehicleRes.data || vehicleRes || [];
                setCustomers(customerData);
                setVehicles(vehicleData);
                if (customerData.length > 0) {
                    setFormData(prev => ({...prev, customer_id: customerData[0].id}));
                }
                if (vehicleData.length > 0) {
                    setFormData(prev => ({...prev, vehicle_id: vehicleData[0].id}));
                }
            } catch (error) {
                console.error("Failed to fetch customers/vehicles", error);
                const message = error instanceof Error ? error.message : "Failed to load required data.";
                notifyError(message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response: any = await api.post('/invoices', formData);
            // The successful response contains a 'data' object with the new invoice.
            const newInvoice = response.data;

            // The API returns the UUID in the 'id' field.
            if (newInvoice && newInvoice.id) {
                onClose();
                navigate(`/invoices/${newInvoice.id}/edit`);
            } else {
                console.error("Invalid response structure:", response);
                throw new Error('Invoice created, but the response was not in the expected format.');
            }
        } catch (error) {
            console.error("Failed to create invoice", error);
            const message = error instanceof Error ? error.message : 'Unknown error creating invoice.';
            notifyError(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Invoice">
            <form onSubmit={handleSubmit} className="space-y-6">
                {isLoading ? <p>Loading...</p> : (
                    <>
                        <Select label="Customer" id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                            <option value="" disabled>Select customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                        <Select label="Vehicle" id="vehicle_id" name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                             <option value="" disabled>Select vehicle</option>
                             {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.registration_number})</option>)}
                        </Select>
                        <Input label="Issue Date" id="issue_date" name="issue_date" type="date" value={formData.issue_date} onChange={handleChange} required />
                        <Input label="Due Date" id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
                         <Select label="Currency" id="currency" name="currency" value={formData.currency} onChange={handleChange} required>
                            <option value="KES">Kenyan Shilling (KES)</option>
                        </Select>
                    </>
                )}
                <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || isSaving}>{isSaving ? 'Creating...' : 'Create and Add Items'}</Button>
                </div>
            </form>
        </Modal>
    );
};

interface InvoiceFilters {
    customer_id: string;
    vehicle_id: string;
    status: string;
    issue_date_from: string;
    issue_date_to: string;
}

const Invoices: React.FC = () => {
  const { items: invoices, deleteItem, loading, error, pagination, refetch } = useCrud<Invoice>('/invoices');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice['id'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({ customer_id: '', vehicle_id: '', status: '', issue_date_from: '', issue_date_to: '' });
  const navigate = useNavigate();

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
        });
        debouncedRefetch(`/invoices?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, debouncedRefetch]);

  const getStatusClass = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Issued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Cancelled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  };
  
  const handleDelete = (id: string | number) => {
    setInvoiceToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
        await deleteItem(invoiceToDelete);
        setInvoiceToDelete(null);
        setIsConfirmModalOpen(false);
    }
  };
  
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
      <span>Showing {pagination.meta?.from ?? 0} to {pagination.meta?.to ?? 0} of {pagination.meta?.total ?? 0} results</span>
      <div className="space-x-2">
        <Button onClick={() => refetch(pagination.links?.prev)} disabled={!pagination.links?.prev || loading} variant="secondary">Previous</Button>
        <Button onClick={() => refetch(pagination.links?.next)} disabled={!pagination.links?.next || loading} variant="secondary">Next</Button>
      </div>
    </div>
  );

  const columns: Column<Invoice>[] = useMemo(() => [
    { header: 'Number', accessor: 'code' },
    { header: 'Customer', accessor: (inv) => inv.customer?.name || 'N/A' },
    { header: 'Vehicle', accessor: (inv) => inv.vehicle ? `${inv.vehicle.brand} (${inv.vehicle.registration_number})` : 'N/A'},
    { header: 'Issue Date', accessor: (inv) => new Date(inv.issue_date).toLocaleDateString() },
    { header: 'Due Date', accessor: (inv) => new Date(inv.due_date).toLocaleDateString() },
    { header: 'Total', accessor: (inv) => `${inv.currency} ${(Number(inv.total_amount) || 0).toFixed(2)}` },
    { header: 'Status', accessor: (inv) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(inv.status)}`}>
            {inv.status}
        </span>
    )},
  ], []);

  return (
    <>
      <Header title="Invoices">
        <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            Add Invoice
        </Button>
      </Header>
      <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Invoices"
              id="search"
              placeholder="Search by number, customer, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 self-end">
            <FilterPopover onFilter={setFilters} initialFilters={filters}>
              {(tempFilters, setTempFilters) => (
                <div className="space-y-4">
                  <Select label="Customer" name="customer_id" value={tempFilters.customer_id} onChange={(e) => setTempFilters({...tempFilters, customer_id: e.target.value})} disabled={customersLoading}>
                    <option value="">All Customers</option>
                    {customers?.map(c => <option key={c.id} value={c.id as string}>{c.name}</option>)}
                  </Select>
                  <Select label="Vehicle" name="vehicle_id" value={tempFilters.vehicle_id} onChange={(e) => setTempFilters({...tempFilters, vehicle_id: e.target.value})} disabled={vehiclesLoading}>
                    <option value="">All Vehicles</option>
                    {vehicles?.map(v => <option key={v.id} value={v.id as string}>{v.registration_number}</option>)}
                  </Select>
                  <Select label="Status" name="status" value={tempFilters.status} onChange={(e) => setTempFilters({...tempFilters, status: e.target.value})}>
                    <option value="">All Statuses</option>
                    {['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                   <div className="grid grid-cols-2 gap-2">
                        <Input label="Issued From" name="issue_date_from" type="date" value={tempFilters.issue_date_from} onChange={(e) => setTempFilters({...tempFilters, issue_date_from: e.target.value})} />
                        <Input label="Issued To" name="issue_date_to" type="date" value={tempFilters.issue_date_to} onChange={(e) => setTempFilters({...tempFilters, issue_date_to: e.target.value})} />
                   </div>
                </div>
              )}
            </FilterPopover>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={loading}
        error={error}
        renderActions={(invoice) => (
          <>
            <Button variant="icon" title="View" onClick={() => navigate(`/invoices/${invoice.id}`)}><EyeIcon /></Button>
            <Button variant="icon" title="Edit" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}><EditIcon /></Button>
            <Button variant="icon" title="Delete" onClick={() => handleDelete(invoice.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta?.total > 0 && <PaginationControls />}
      <InvoiceInitialCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </>
  );
};

export default Invoices;
