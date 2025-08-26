
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Invoice, Customer, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, EyeIcon } from '../components/icons';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Input from '../components/Input';
import api from '../services/api';

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
        currency: 'USD',
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
                    setFormData(prev => ({...prev, customer_id: customerData[0].uuid || customerData[0].id}));
                }
                if (vehicleData.length > 0) {
                    setFormData(prev => ({...prev, vehicle_id: vehicleData[0].uuid || vehicleData[0].id}));
                }
            } catch (error) {
                console.error("Failed to fetch customers/vehicles", error);
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
            const newInvoice = response.data || response;
            onClose();
            navigate(`/invoices/${newInvoice.uuid}/edit`);
        } catch (error) {
            console.error("Failed to create invoice", error);
            alert(`Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                            {customers.map(c => <option key={c.uuid || c.id} value={c.uuid || c.id}>{c.name}</option>)}
                        </Select>
                        <Select label="Vehicle" id="vehicle_id" name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                             <option value="" disabled>Select vehicle</option>
                             {vehicles.map(v => <option key={v.uuid || v.id} value={v.uuid || v.id}>{v.brand} {v.model} ({v.registration_number})</option>)}
                        </Select>
                        <Input label="Issue Date" id="issue_date" name="issue_date" type="date" value={formData.issue_date} onChange={handleChange} required />
                        <Input label="Due Date" id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
                         <Select label="Currency" id="currency" name="currency" value={formData.currency} onChange={handleChange} required>
                            <option value="USD">United States Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="GBP">British Pound (GBP)</option>
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


const Invoices: React.FC = () => {
  const { items: invoices, deleteItem, loading, error } = useCrud<Invoice>('/invoices');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const getStatusClass = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return '';
    }
  };

  const columns: Column<Invoice>[] = useMemo(() => [
    { header: 'Number', accessor: 'code' },
    { header: 'Customer', accessor: (inv) => inv.customer?.name || 'N/A' },
    { header: 'Vehicle', accessor: (inv) => inv.vehicle ? `${inv.vehicle.brand} (${inv.vehicle.registration_number})` : 'N/A'},
    { header: 'Issue Date', accessor: (inv) => new Date(inv.issue_date).toLocaleDateString() },
    { header: 'Due Date', accessor: (inv) => new Date(inv.due_date).toLocaleDateString() },
    { header: 'Total', accessor: (inv) => `${inv.currency} ${inv.total_amount.toFixed(2)}` },
    { header: 'Status', accessor: (inv) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(inv.status)}`}>
            {inv.status}
        </span>
    )},
  ], []);

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.code}?`)) {
      await deleteItem(invoice.uuid || invoice.id);
    }
  };

  return (
    <>
      <Header title="Invoices">
        <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon />
            Add Invoice
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={loading}
        error={error}
        renderActions={(invoice) => (
          <>
            <Button variant="icon" title="View" onClick={() => navigate(`/invoices/${invoice.uuid || invoice.id}`)}><EyeIcon /></Button>
            <Button variant="icon" title="Edit" onClick={() => navigate(`/invoices/${invoice.uuid || invoice.id}/edit`)}><EditIcon /></Button>
            <Button variant="icon" title="Delete" onClick={() => handleDelete(invoice)}><DeleteIcon /></Button>
          </>
        )}
      />
      <InvoiceInitialCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default Invoices;