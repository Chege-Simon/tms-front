
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import { useCrud } from '../hooks/useCrud';
import type { Journal, Expense } from '../types';
import { JournalTypeEnum } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';

const Journals: React.FC = () => {
  const { items: journals, loading, error, pagination, refetch } = useCrud<Journal>('/journals');
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const url = searchTerm ? `/journals?search=${encodeURIComponent(searchTerm)}` : '/journals';
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedRefetch]);

  const columns: Column<Journal>[] = useMemo(() => [
    { header: 'Date', accessor: (j) => j.created_at ? new Date(j.created_at).toLocaleString() : 'N/A' },
    { header: 'Journal Code', accessor: 'code' },
    { header: 'Customer', accessor: (j) => j.customer?.name || 'N/A' },
    { 
      header: 'Particulars', 
      accessor: (j: Journal) => {
        const target = j.journal_target;
        const targetCode = target?.code || '';

        if (targetCode.startsWith('EXP-')) {
          const expenseType = (target as Expense).type?.replace(/_/g, ' ') || 'Expense';
          return `${expenseType} (${targetCode})`;
        }
        if (targetCode.startsWith('PAY-')) {
          return `Payment Received (${targetCode})`;
        }
        if (targetCode) {
          return `Transaction (${targetCode})`;
        }
        return 'Journal Entry';
      }
    },
    { 
      header: 'Debit', 
      accessor: (j) => j.journal_type === JournalTypeEnum.DEBIT ? `${j.currency} ${(j.amount || 0).toFixed(2)}` : '' 
    },
    { 
      header: 'Credit', 
      accessor: (j) => j.journal_type === JournalTypeEnum.CREDIT ? `${j.currency} ${(j.amount || 0).toFixed(2)}` : '' 
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
      <Header title="Financial Journals" />
       <div className="mb-4">
        <Input 
            label="Search Journals"
            id="search"
            placeholder="Search by journal code, customer, amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DataTable
        columns={columns}
        data={journals || []}
        isLoading={loading}
        error={error}
        renderActions={() => (
          <span className="text-xs text-gray-400">Read-only</span>
        )}
      />
      {pagination.meta && pagination.meta.total > 0 && <PaginationControls />}
    </>
  );
};

export default Journals;