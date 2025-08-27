
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCrud } from '../hooks/useCrud';
import type { Document, Documentable } from '../types';
import { EditIcon, DeleteIcon } from '../components/icons';
import Input from '../components/Input';
import FilterPopover from '../components/FilterPopover';
import Select from '../components/Select';
import Modal from '../components/Modal';
import { formatDateTimeForInput, formatDateForApi } from '../services/datetime';

const documentTypes: Array<Document['file_type']> = ['LOG_BOOK', 'LICENSE', 'IDENTIFICATION', 'RECEIPT', 'CHEQUE', 'INSURANCE'];

interface DocumentFilters {
    file_type: string;
    upload_date_from: string;
    upload_date_to: string;
}

interface DocumentFormData {
    id?: string | number;
    file_type: Document['file_type'];
    upload_date: string;
    file_path: string;
}

const Documents: React.FC = () => {
  const { items: documents, updateItem, deleteItem, loading, error, pagination, refetch } = useCrud<Document>('/documents');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<DocumentFormData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Document['id'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({ file_type: '', upload_date_from: '', upload_date_to: '' });

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

  const getAssociatedTo = (doc: Documentable | undefined) => {
    if (!doc || !doc.code) return 'N/A';
    
    const code = doc.code;
    if (code.startsWith('DRI-')) return `Driver: ${doc.name} (${code})`;
    if (code.startsWith('VEH-')) return `Vehicle: ${doc.registration_number} (${code})`;
    if (code.startsWith('EXP-')) return `Expense: ${code}`;
    if (code.startsWith('PAY-')) return `Payment: ${code}`;

    return `Record: ${code}`;
  }
  
  const handleEdit = (doc: Document) => {
    setItemToEdit({
        id: doc.id,
        file_type: doc.file_type,
        upload_date: formatDateTimeForInput(doc.upload_date),
        file_path: doc.file_path,
    });
    setIsModalOpen(true);
  };
  
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
    if (!itemToEdit) return;
    
    const payload = {
        ...itemToEdit,
        upload_date: formatDateForApi(itemToEdit.upload_date),
    };
    
    await updateItem(payload as any);
    setIsModalOpen(false);
    setItemToEdit(null);
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!itemToEdit) return;
    const { name, value } = e.target;
    setItemToEdit(prev => prev ? { ...prev, [name]: value } : null);
  };

  const columns: Column<Document>[] = useMemo(() => [
    { header: 'Code', accessor: 'code' },
    { header: 'File Type', accessor: (doc) => doc.file_type.replace(/_/g, ' ') },
    { header: 'Associated To', accessor: (doc) => getAssociatedTo(doc.documentable) },
    { header: 'Upload Date', accessor: (doc) => new Date(doc.upload_date).toLocaleString() },
    { header: 'File', accessor: (doc) => <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">View Document</a> },
  ], []);
  
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
      <Header title="Documents" />
      <div className="flex justify-between mb-4 gap-4">
        <div className="flex-grow">
          <Input 
              label="Search Documents"
              id="search"
              placeholder="Search by code, file type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0 self-end">
            <FilterPopover onFilter={setFilters} initialFilters={filters}>
                {(tempFilters, setTempFilters) => (
                    <div className="space-y-4">
                        <Select label="Document Type" name="file_type" value={tempFilters.file_type} onChange={(e) => setTempFilters({...tempFilters, file_type: e.target.value})}>
                            <option value="">All Types</option>
                            {documentTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="Uploaded From" name="upload_date_from" type="date" value={tempFilters.upload_date_from} onChange={(e) => setTempFilters({...tempFilters, upload_date_from: e.target.value})} />
                            <Input label="Uploaded To" name="upload_date_to" type="date" value={tempFilters.upload_date_to} onChange={(e) => setTempFilters({...tempFilters, upload_date_to: e.target.value})} />
                        </div>
                    </div>
                )}
            </FilterPopover>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={documents}
        isLoading={loading}
        error={error}
        renderActions={(document) => (
          <>
            <Button variant="icon" onClick={() => handleEdit(document)}><EditIcon /></Button>
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
      
      {itemToEdit && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Document">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Select label="File Type" name="file_type" value={itemToEdit.file_type} onChange={handleChange} required>
                    {documentTypes.map(type => <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>)}
                </Select>
                <Input label="Upload Date" name="upload_date" type="datetime-local" value={itemToEdit.upload_date} onChange={handleChange} required />
                <Input label="File Path" name="file_path" value={itemToEdit.file_path} readOnly disabled />
                 <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Modal>
      )}
    </>
  );
};

export default Documents;