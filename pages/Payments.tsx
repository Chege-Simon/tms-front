import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Payment, Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { formatDateForApi, formatDateTimeForInput } from '../services/datetime';
import FilterPopover from '../components/FilterPopover';
import EntityDocumentManager from '../components/EntityDocumentManager';

// Form data shape for add/edit operations
interface PaymentFormData {
  id?: string | number; // UUID
  customer_id: string; // UUID
  payment_date: string; // "YYYY-MM-DDTHH:mm" for input
  currency: 'KES';
  total_amount: number;
  notes?: string;
}

const emptyPaymentForm: Omit<PaymentFormData, 'id'> = {
  customer_id: '',
  payment_date: formatDateTimeForInput(new Date().toISOString()),
  currency: 'KES',
  total_amount: 0,
  notes: '',
};

interface PaymentFilters {
    customer_id: string;
    payment_date_from: string;
    payment_date_to: string;
}

const Payments: React.FC = () => {
  const { items: payments, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Payment>('/payments');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Payment['id'] | null>(null);
  const [currentItem, setCurrentItem] = useState<PaymentFormData>(emptyPaymentForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({ customer_id: '', payment_date_from: '', payment_date_to: '' });

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
      });
      const url = `/payments?${params.toString()}`;
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, debouncedRefetch]);

  const columns: Column<Payment>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Customer', accessor: (p) => p.customer?.name || 'N/A' },
    { header: 'Payment Date', accessor: (p) => new Date(p.payment_date).toLocaleString() },
    { header: 'Amount', accessor: (p) => `${p.currency} ${(Number(p.total_amount) || 0).toFixed(2)}` },
    { header: 'Notes', accessor: 'notes' },
  ], []);

  const handleEdit = (payment: Payment) => {
    setCurrentItem({
      id: payment.id,
      customer_id: (payment.customer?.id as string) || payment.customer_id,
      payment_date: formatDateTimeForInput(payment.payment_date),
      currency: 'KES',
      total_amount: payment.total_amount,
      notes: payment.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem({
      ...emptyPaymentForm,
      customer_id: (customers?.[0]?.id as string) || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

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
    const payload = {
      ...currentItem,
      payment_date: formatDateForApi(currentItem.payment_date),
    };

    if (payload.id) {
      await updateItem(payload as any);
    } else {
      await addItem(payload as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['total_amount'].includes(name);
    setCurrentItem(prev => ({
      ...prev,
      [name]: isNumeric ? parseFloat(value) || 0 : value,
    }));
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

  return (
    <>
      <Header title="Payments">
        <Button onClick={handleAddNew} disabled={customersLoading}>
          <PlusIcon /> Add Payment
        </Button>
      </Header>
      <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input
            label="Search Payments"
            id="search"
            placeholder="Search by code, customer, amount..."
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
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="From Date" name="payment_date_from" type="date" value={tempFilters.payment_date_from} onChange={(e) => setTempFilters({...tempFilters, payment_date_from: e.target.value})} />
                            <Input label="To Date" name="payment_date_to" type="date" value={tempFilters.payment_date_to} onChange={(e) => setTempFilters({...tempFilters, payment_date_to: e.target.value})} />
                        </div>
                    </div>
                )}
            </FilterPopover>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={payments}
        isLoading={loading}
        error={error}
        renderActions={(payment) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(payment)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(payment.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta?.total > 0 && <PaginationControls />}
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this payment? This action cannot be undone."
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Payment' : 'Add Payment'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select label="Customer" name="customer_id" id="customer_id" value={currentItem.customer_id} onChange={handleChange} required disabled={customersLoading}>
            <option value="">Select a customer</option>
            {customers?.map(c => <option key={c.id} value={c.id as string}>{c.name}</option>)}
          </Select>

          <Input label="Payment Date & Time" id="payment_date" name="payment_date" type="datetime-local" value={currentItem.payment_date} onChange={handleChange} required />
          
          <Input label="Total Amount (KES)" id="total_amount" name="total_amount" type="number" step="0.01" value={currentItem.total_amount} onChange={handleChange} required />

          <Textarea label="Notes" id="notes" name="notes" value={currentItem.notes || ''} onChange={handleChange} rows={3} />

          {currentItem.id && (
              <EntityDocumentManager 
                  entityId={currentItem.id} 
                  entityTypeForUpload="CHEQUE"
                  label="Cheques"
              />
          )}

          <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Payments;