
import React, { useMemo } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import { useCrud } from '../hooks/useCrud';
import type { Journal } from '../types';
import Button from '../components/Button';

const Journals: React.FC = () => {
  const { items: journals, loading, error, pagination, refetch } = useCrud<Journal>('/journals');

  const columns: Column<Journal>[] = useMemo(() => [
    { header: 'Date', accessor: (j) => j.created_at ? new Date(j.created_at).toLocaleString() : 'N/A' },
    { header: 'Customer', accessor: (j) => j.customer?.name || 'N/A' },
    { 
      header: 'Description', 
      accessor: (j) => {
        const type = j.journalable_type?.split('\\').pop() || 'Entry';
        return `${type} recorded for ${j.customer?.name || 'customer'}`;
      }
    },
    { 
      header: 'Debit', 
      accessor: (j) => j.journal_type === 'DEBIT' ? `${j.currency} ${(j.amount || 0).toFixed(2)}` : '' 
    },
    { 
      header: 'Credit', 
      accessor: (j) => j.journal_type === 'CREDIT' ? `${j.currency} ${(j.amount || 0).toFixed(2)}` : '' 
    },
  ], []);

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
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
    </>
  );
};

export default Journals;
