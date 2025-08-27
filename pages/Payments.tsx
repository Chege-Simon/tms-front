import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud } from '../hooks/useCrud';
import type { Payment } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { notifyWarning } from '../services/notification';

const Payments: React.FC = () => {
  const { items: payments, deleteItem, loading, error } = useCrud<Payment>('/payments');

  const columns: Column<Payment>[] = useMemo(() => [
    { header: 'Invoice ID', accessor: 'invoice_id' },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Amount', accessor: (p) => `KES ${p.amount.toFixed(2)}` },
    { header: 'Payment Method', accessor: 'payment_method' },
  ], []);
  
  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
        deleteItem(id);
    }
  };

  return (
    <>
      <Header title="Payments">
        <Button onClick={() => notifyWarning('Add new payment functionality not implemented.')}>
          <PlusIcon />
          Add Payment
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={payments}
        isLoading={loading}
        error={error}
        renderActions={(payment) => (
          <>
            <Button variant="icon" onClick={() => notifyWarning('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(payment.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default Payments;