import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import { useFetch } from '../hooks/useCrud';
import type { Journal } from '../types';

const Journals: React.FC = () => {
  const { data: journals, loading, error } = useFetch<Journal[]>('/journals');

  const columns: Column<Journal>[] = useMemo(() => [
    { header: 'Date', accessor: 'date' },
    { header: 'Account', accessor: 'account' },
    { header: 'Debit', accessor: (j) => `$${j.debit.toFixed(2)}` },
    { header: 'Credit', accessor: (j) => `$${j.credit.toFixed(2)}` },
    { header: 'Description', accessor: 'description' },
  ], []);

  return (
    <>
      <Header title="Journals (Read-only)" />
      <DataTable
        columns={columns}
        data={journals || []}
        isLoading={loading}
        error={error}
        renderActions={() => (
          <span className="text-xs text-gray-400">No actions</span>
        )}
      />
    </>
  );
};

export default Journals;
