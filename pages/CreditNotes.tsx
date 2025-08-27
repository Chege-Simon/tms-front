
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DataTable, { type Column } from '../components/DataTable';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import Input from '../components/Input';
import Select from '../components/Select';
import { useCrud, useFetch } from '../hooks/useCrud';
import type { CreditNote, Customer } from '../types';
import { EditIcon, DeleteIcon, PlusIcon, EyeIcon } from '../components/icons';
import api from '../services/api';
import { notifyError } from '../services/notification';

const CreditNoteInitialCreateModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');
    const [formData, setFormData] = useState({
        issue_date: new Date().toISOString().split('T')[0],
        customer_id: '',
        currency: 'KES',
        total_amount: 0,
        status: 'Draft',
    });

    useEffect(() => {
        if (isOpen && customers && customers.length > 0 && !formData.customer_id) {
            setFormData(prev => ({ ...prev, customer_id: customers[0].id as string }));
        }
    }, [isOpen, customers, formData.customer_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...formData, issue_date: `${formData.issue_date} 00:00:00` };
            const response: any = await api.post('/credit_notes', payload);
            const newCreditNote = response.data;

            if (newCreditNote && newCreditNote.id) {
                onClose();
                navigate(`/credit-notes/${newCreditNote.id}/edit`);
            } else {
                throw new Error('Credit note created, but the response was not in the expected format.');
            }
        } catch (error) {
            console.error("Failed to create credit note", error);
            const message = error instanceof Error ? error.message : 'Unknown error creating credit note.';
            notifyError(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Credit Note">
            <form onSubmit={handleSubmit} className="space-y-6">
                {customersLoading ? <p>Loading customers...</p> : (
                    <>
                        <Select label="Customer" id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange} required>
                            <option value="" disabled>Select customer</option>
                            {customers?.map(c => <option key={c.id} value={c.id as string}>{c.name}</option>)}
                        </Select>
                        <Input label="Issue Date" id="issue_date" name="issue_date" type="date" value={formData.issue_date} onChange={handleChange} required />
                    </>
                )}
                <div className="flex justify-end pt-6 space-x-2 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={customersLoading || isSaving}>{isSaving ? 'Creating...' : 'Create and Add Items'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const CreditNotes: React.FC = () => {
    const { items: creditNotes, deleteItem, loading, error, pagination, refetch } = useCrud<CreditNote>('/credit_notes');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<CreditNote['id'] | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const debouncedRefetch = useCallback(refetch, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            const url = searchTerm ? `/credit_notes?search=${encodeURIComponent(searchTerm)}` : '/credit_notes';
            debouncedRefetch(url);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, debouncedRefetch]);

    const getStatusClass = (status: CreditNote['status']) => {
        switch (status) {
            case 'Issued': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Applied': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Draft':
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const columns: Column<CreditNote>[] = useMemo(() => [
        { header: 'Number', accessor: 'code' },
        { header: 'Customer', accessor: (cn) => cn.customer?.name || 'N/A' },
        { header: 'Issue Date', accessor: (cn) => new Date(cn.issue_date).toLocaleDateString() },
        { header: 'Amount', accessor: (cn) => `${cn.currency} ${(cn.total_amount || 0).toFixed(2)}` },
        {
            header: 'Status', accessor: (cn) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(cn.status)}`}>
                    {cn.status}
                </span>
            )
        },
    ], []);

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
            <Header title="Credit Notes">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon /> Add Credit Note
                </Button>
            </Header>
            <div className="mb-4">
                <Input
                    label="Search Credit Notes"
                    id="search"
                    placeholder="Search by number, customer, amount..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DataTable
                columns={columns}
                data={creditNotes}
                isLoading={loading}
                error={error}
                renderActions={(cn) => (
                    <>
                        <Button variant="icon" title="View" onClick={() => navigate(`/credit-notes/${cn.id}`)}><EyeIcon /></Button>
                        <Button variant="icon" title="Edit" onClick={() => navigate(`/credit-notes/${cn.id}/edit`)}><EditIcon /></Button>
                        <Button variant="icon" title="Delete" onClick={() => handleDelete(cn.id)}><DeleteIcon /></Button>
                    </>
                )}
            />
            {pagination.meta?.total > 0 && <PaginationControls />}
            <CreditNoteInitialCreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this credit note? This action cannot be undone."
            />
        </>
    );
};

export default CreditNotes;
