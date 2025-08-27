
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Expense, Vehicle, InvoiceItem } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { formatDateForApi, formatDateTimeForInput } from '../services/datetime';

// Form data shape for add/edit operations
interface ExpenseFormData {
  id?: string | number; // UUID
  vehicle_id: string; // UUID
  invoice_item_id?: string | null; // UUID
  type: Expense['type'];
  expense_date: string; // "YYYY-MM-DDTHH:mm" for input
  currency: 'KES';
  amount: number;
}

const expenseTypes: Array<Expense['type']> = [
    'DRIVER_WAGE', 'LOADING_COST', 'FUEL_COST', 'MAINTENANCE_COST', 'VEHICHLE_SERVICE_COST', 'INSURANCE'
];

const emptyExpenseForm: Omit<ExpenseFormData, 'id'> = {
  vehicle_id: '',
  invoice_item_id: null,
  type: expenseTypes[0],
  expense_date: formatDateTimeForInput(new Date().toISOString()),
  currency: 'KES',
  amount: 0,
};

const Expenses: React.FC = () => {
  const { items: expenses, addItem, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Expense>('/expenses');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  const { data: invoiceItems, loading: invoiceItemsLoading } = useFetch<InvoiceItem[]>('/invoice_items');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Expense['id'] | null>(null);
  const [currentItem, setCurrentItem] = useState<ExpenseFormData>(emptyExpenseForm);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/expenses?search=${encodeURIComponent(searchTerm)}` : '/expenses';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<Expense>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'Vehicle', accessor: (exp) => exp.vehicle ? `${exp.vehicle.brand} (${exp.vehicle.registration_number})` : 'N/A' },
    { header: 'Type', accessor: (exp) => exp.type.replace(/_/g, ' ') },
    { header: 'Date', accessor: (exp) => new Date(exp.expense_date).toLocaleString() },
    { header: 'Amount', accessor: (exp) => `${exp.currency} ${(exp.amount || 0).toFixed(2)}` },
    { header: 'Invoice Item', accessor: (exp) => exp.invoice_item?.code || 'N/A' },
  ], []);

  const handleEdit = (expense: Expense) => {
    setCurrentItem({
      id: expense.id,
      vehicle_id: expense.vehicle?.id as string || expense.vehicle_id,
      invoice_item_id: expense.invoice_item?.id as string || expense.invoice_item_id,
      type: expense.type,
      expense_date: formatDateTimeForInput(expense.expense_date),
      currency: 'KES',
      amount: expense.amount,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentItem({
      ...emptyExpenseForm,
      vehicle_id: (vehicles?.[0]?.id as string) || '',
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
      total_amount: currentItem.amount, // API expects total_amount on save
      expense_date: formatDateForApi(currentItem.expense_date),
      invoice_item_id: currentItem.invoice_item_id || null
    };

    if (payload.id) {
      await updateItem(payload as any);
    } else {
      await addItem(payload as any);
    }
    handleCloseModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['amount'].includes(name);
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
      <Header title="Expenses">
        <Button onClick={handleAddNew} disabled={vehiclesLoading}>
          <PlusIcon /> Add Expense
        </Button>
      </Header>
      <div className="mb-4">
        <Input
          label="Search Expenses"
          id="search"
          placeholder="Search by code, type, vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={expenses}
        isLoading={loading}
        error={error}
        renderActions={(expense) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(expense)}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(expense.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta?.total > 0 && <PaginationControls />}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this expense? This action cannot be undone."
      />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem.id ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Select label="Vehicle" name="vehicle_id" id="vehicle_id" value={currentItem.vehicle_id} onChange={handleChange} required disabled={vehiclesLoading}>
            <option value="">Select a vehicle</option>
            {vehicles?.map(v => <option key={v.id} value={v.id as string}>{v.brand} {v.model} ({v.registration_number})</option>)}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select label="Type" name="type" id="type" value={currentItem.type} onChange={handleChange} required>
              {expenseTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
            </Select>
            <Input label="Total Amount (KES)" id="amount" name="amount" type="number" step="0.01" value={currentItem.amount} onChange={handleChange} required />
          </div>

          <Input label="Expense Date & Time" id="expense_date" name="expense_date" type="datetime-local" value={currentItem.expense_date} onChange={handleChange} required />

          <Select label="Related Invoice Item (Optional)" name="invoice_item_id" id="invoice_item_id" value={currentItem.invoice_item_id || ''} onChange={handleChange} disabled={invoiceItemsLoading}>
            <option value="">None</option>
            {invoiceItems?.map(item => <option key={item.id} value={item.id as string}>Inv: {item.invoice?.code} / Dest: {item.destination}</option>)}
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

export default Expenses;
