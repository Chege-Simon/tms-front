import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Invoice, Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const Invoices: React.FC = () => {
  const { items: invoices, deleteItem, loading, error } = useCrud<Invoice>('/invoices');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');

  const customerMap = useMemo(() => {
    return customers?.reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
    }, {} as Record<number, string>) || {};
  }, [customers]);

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
    { header: 'Number', accessor: 'invoice_number' },
    { header: 'Customer', accessor: (inv) => customerMap[inv.customer_id] || 'N/A' },
    { header: 'Issue Date', accessor: 'issue_date' },
    { header: 'Due Date', accessor: 'due_date' },
    { header: 'Total', accessor: (inv) => `$${inv.total_amount.toFixed(2)}` },
    { header: 'Status', accessor: (inv) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(inv.status)}`}>
            {inv.status}
        </span>
    )},
  ], [customerMap]);

  return (
    <>
      <Header title="Invoices">
        <Button onClick={() => alert('Add new invoice functionality not implemented.')}>
          <PlusIcon />
          Add Invoice
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={loading || customersLoading}
        error={error}
        renderActions={(invoice) => (
          <>
            <Button variant="icon" onClick={() => alert('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(invoice.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default Invoices;