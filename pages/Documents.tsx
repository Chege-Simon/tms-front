
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { Document, Driver, Vehicle } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from '../components/icons';
import Input from '../components/Input';
import FilterPopover from '../components/FilterPopover';
import Select from '../components/Select';

const documentTypes: Array<Document['type']> = ['LOG_BOOK', 'LICENSE', 'IDENTIFICATION', 'RECEIPT', 'CHEQUE', 'INSURANCE'];

interface DocumentFilters {
    type: string;
    expiry_date_from: string;
    expiry_date_to: string;
}

const Documents: React.FC = () => {
  const { items: documents, deleteItem, loading, error, pagination, refetch } = useCrud<Document>('/documents');
  const { data: drivers, loading: driversLoading } = useFetch<Driver[]>('/drivers');
  const { data: vehicles, loading: vehiclesLoading } = useFetch<Vehicle[]>('/vehicles');
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Document['id'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({ type: '', expiry_date_from: '', expiry_date_to: '' });

  const debouncedRefetch = useCallback(refetch, []);

  useEffect(() => {
    const handler = setTimeout(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        debouncedRefetch(`/documents?${params.toString()}`);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, debouncedRefetch]);

  const getOwnerName = (doc: Document) => {
    const driver = drivers?.find(d => d.id === doc.owner_id);
    if(driver) return `Driver: ${driver.name}`;

    const vehicle = vehicles?.find(v => v.id === doc.owner_id);
    if(vehicle) return `Vehicle: ${vehicle.brand} ${vehicle.model}`;

    return 'N/A';
  }
  
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

  const columns: Column<Document>[] = useMemo(() => [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Owner', accessor: (doc) => getOwnerName(doc) },
    { header: 'Expiry Date', accessor: 'expiry_date' },
    { header: 'File', accessor: (doc) => <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View</a> },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [drivers, vehicles]);
  
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
      <Header title="Documents">
        <Button onClick={() => alert('Add new document functionality not implemented.')}>
          <PlusIcon />
          Add Document
        </Button>
      </Header>
      <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Documents"
              id="search"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 self-end">
            <FilterPopover onFilter={setFilters} initialFilters={filters}>
                {(tempFilters, setTempFilters) => (
                    <div className="space-y-4">
                        <Select label="Document Type" name="type" value={tempFilters.type} onChange={(e) => setTempFilters({...tempFilters, type: e.target.value})}>
                            <option value="">All Types</option>
                            {documentTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Expires From" name="expiry_date_from" type="date" value={tempFilters.expiry_date_from} onChange={(e) => setTempFilters({...tempFilters, expiry_date_from: e.target.value})} />
                            <Input label="Expires To" name="expiry_date_to" type="date" value={tempFilters.expiry_date_to} onChange={(e) => setTempFilters({...tempFilters, expiry_date_to: e.target.value})} />
                        </div>
                    </div>
                )}
            </FilterPopover>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={documents}
        isLoading={loading || driversLoading || vehiclesLoading}
        error={error}
        renderActions={(document) => (
          <>
            <Button variant="icon" onClick={() => alert('Edit not implemented')}><EditIcon /></Button>
            <Button variant="icon" onClick={() => handleDelete(document.id)}><DeleteIcon /></Button>
          </>
        )}
      />
      {pagination.meta?.total > 0 && <PaginationControls />}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />
    </>
  );
};

export default Documents;
