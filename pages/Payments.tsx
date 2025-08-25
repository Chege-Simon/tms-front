import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud } from '../hooks/useCrud';
import type { Payment } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';

const Payments: React.FC = () => {
  const { items: payments, deleteItem, loading, error } = useCrud<Payment>('/payments');

  const columns: Column<Payment>[] = useMemo(() => [
    { header: 'Invoice ID', accessor: 'invoice_id' },
    { header: 'Payment Date', accessor: 'payment_date' },
    { header: 'Amount', accessor: (p) => `$${p.amount.toFixed(2)}` },
    { header: 'Payment Method', accessor: 'payment_method' },
  ], []);

  return (
    <>
      <Header title="Payments">
        <Button onClick={() => alert('Add new payment functionality not implemented.')}>
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
            <Button variant="icon" onClick={() => alert('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => deleteItem(payment.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default Payments;
