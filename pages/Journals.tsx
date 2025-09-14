
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Journal, Expense, Customer } from '../types';
import { JournalTypeEnum } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import FilterPopover from '../components/FilterPopover';
import Select from '../components/Select';

interface JournalFilters {
    customer_id: string;
    journal_type: string;
    created_at_from: string;
    created_at_to: string;
}

const Journals: React.FC = () => {
  const { items: journals, loading, error, pagination, refetch } = useCrud<Journal>('/journals');
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<JournalFilters>({ customer_id: '', journal_type: '', created_at_from: '', created_at_to: '' });

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
      });
      const url = `/journals?${params.toString()}`;
      debouncedRefetch(url);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, debouncedRefetch]);

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
      accessor: (j) => j.journal_type === JournalTypeEnum.DEBIT ? `${j.currency} ${(Number(j.amount) || 0).toFixed(2)}` : '' 
    },
    { 
      header: 'Credit', 
      accessor: (j) => j.journal_type === JournalTypeEnum.CREDIT ? `${j.currency} ${(Number(j.amount) || 0).toFixed(2)}` : '' 
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
       <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Journals"
              id="search"
              placeholder="Search by journal code, customer, amount..."
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
                        <Select label="Journal Type" name="journal_type" value={tempFilters.journal_type} onChange={(e) => setTempFilters({...tempFilters, journal_type: e.target.value})}>
                            <option value="">All Types</option>
                            <option value={JournalTypeEnum.DEBIT}>Debit</option>
                            <option value={JournalTypeEnum.CREDIT}>Credit</option>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="From Date" name="created_at_from" type="date" value={tempFilters.created_at_from} onChange={(e) => setTempFilters({...tempFilters, created_at_from: e.target.value})} />
                            <Input label="To Date" name="created_at_to" type="date" value={tempFilters.created_at_to} onChange={(e) => setTempFilters({...tempFilters, created_at_to: e.target.value})} />
                        </div>
                    </div>
                )}
            </FilterPopover>
        </div>
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
