import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { CreditNote, Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import { notifyWarning } from '../services/notification';

const CreditNotes: React.FC = () => {
  const { items: creditNotes, deleteItem, loading, error } = useCrud<CreditNote>('/credit_notes');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');

  const customerMap = useMemo(() => {
    return customers?.reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
    }, {} as Record<number, string>) || {};
  }, [customers]);

  const columns: Column<CreditNote>[] = useMemo(() => [
    { header: 'Number', accessor: 'credit_note_number' },
    { header: 'Invoice #', accessor: 'invoice_id' },
    { header: 'Customer', accessor: (cn) => customerMap[cn.customer_id] || 'N/A' },
    { header: 'Issue Date', accessor: 'issue_date' },
    { header: 'Amount', accessor: (cn) => `KES ${cn.total_amount.toFixed(2)}` },
    { header: 'Reason', accessor: 'reason' },
  ], [customerMap]);
  
  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this credit note?')) {
        deleteItem(id);
    }
  };
  
  return (
    <>
      <Header title="Credit Notes">
        <Button onClick={() => notifyWarning('Add new credit note functionality not implemented.')}>
          <PlusIcon />
          Add Credit Note
        </Button>
      </Header>
      <DataTable
        columns={columns}
        data={creditNotes}
        isLoading={loading || customersLoading}
        error={error}
        renderActions={(creditNote) => (
          <>
            <Button variant="icon" onClick={() => notifyWarning('Edit not implemented.')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(creditNote.id)}><DeleteIcon /></Button>
          </>
        )}
      />
    </>
  );
};

export default CreditNotes;