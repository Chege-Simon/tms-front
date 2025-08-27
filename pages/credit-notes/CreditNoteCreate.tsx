
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { CreditNote, CreditNoteItem } from '../../types';
import Button from '../../components/Button';
import { DeleteIcon, PlusIcon, EditIcon } from '../../components/icons';
import api from '../../services/api';
import { useCrud, useFetch } from '../../hooks/useCrud';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import { notifyError, notifySuccess } from '../../services/notification';

const CreditNoteItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    creditNoteId: string;
    currentItem: Partial<CreditNoteItem> | null;
}> = ({ isOpen, onClose, onSave, creditNoteId, currentItem }) => {
    const isEditMode = currentItem && currentItem.id;
    
    const emptyItem = {
        description: '',
        credit_note_amount: 0,
    };

    const [itemData, setItemData] = useState(emptyItem);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setItemData(isEditMode ? { description: currentItem.description || '', credit_note_amount: currentItem.credit_note_amount || 0 } : emptyItem);
        }
    }, [currentItem, isOpen, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = name === 'credit_note_amount';
        setItemData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditMode) {
                await api.put(`/credit_note_items/${currentItem.id}`, itemData);
            } else {
                await api.post(`/credit_note_items/${creditNoteId}`, itemData);
            }
            notifySuccess(`Item ${isEditMode ? 'updated' : 'added'} successfully.`);
            onSave();
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error saving item.';
            notifyError(message);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Item" : "Add Item"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea label="Description" name="description" value={itemData.description} onChange={handleChange} required rows={4} />
                <Input label="Amount" name="credit_note_amount" type="number" step="0.01" value={itemData.credit_note_amount} onChange={handleChange} required />
                <div className="flex justify-end pt-4 mt-4 space-x-2 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};

const CreditNoteCreate: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: creditNote, loading: cnLoading, error: cnError, refetch: refetchCreditNote } = useFetch<CreditNote>(`/credit_notes/${id}`);
    const { items: creditNoteItems, loading: itemsLoading, error: itemsError, refetch: refetchItems } = useCrud<CreditNoteItem>(`/credit_note_items?credit_note_id=${id}`);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<CreditNoteItem> | null>(null);

    const handleAddItem = () => {
        setCurrentItem(null);
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item: CreditNoteItem) => {
        setCurrentItem(item);
        setIsItemModalOpen(true);
    };
    
    const handleDeleteItem = async (itemId: string | number) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await api.del(`/credit_note_items/${itemId}`);
                notifySuccess('Item deleted successfully.');
                onSaveItem();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete item.';
                notifyError(message);
            }
        }
    };
    
    const onSaveItem = () => {
        refetchItems();
        refetchCreditNote(); // To update total amount
    };

    const columns = useMemo((): Column<CreditNoteItem>[] => [
        { header: 'Description', accessor: 'description' },
        { header: 'Amount', accessor: (item) => `${creditNote?.currency || 'KES'} ${(item.credit_note_amount || 0).toFixed(2)}` },
    ], [creditNote?.currency]);

    if (cnLoading) return <div>Loading Credit Note...</div>;
    if (cnError) return <div className="text-red-500">Error: {cnError.message}</div>;
    if (!creditNote) return <div>Credit Note not found.</div>;
    
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <Link to="/credit-notes" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to credit notes</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Edit Credit Note {creditNote.code}</h1>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700">Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong className="block text-gray-500">Customer:</strong> {creditNote.customer?.name}</div>
                    <div><strong className="block text-gray-500">Issue Date:</strong> {new Date(creditNote.issue_date).toLocaleDateString()}</div>
                    <div><strong className="block text-gray-500">Status:</strong> {creditNote.status}</div>
                    <div><strong className="block text-gray-500">Total Amount:</strong> <span className="font-bold text-base">{creditNote.currency} {(creditNote.total_amount || 0).toFixed(2)}</span></div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Credit Note Items</h2>
                    <Button onClick={handleAddItem}><PlusIcon/> Add Item</Button>
                </div>
                <DataTable 
                    columns={columns}
                    data={creditNoteItems}
                    isLoading={itemsLoading}
                    error={itemsError}
                    renderActions={(item) => (
                        <>
                             <Button variant="icon" onClick={() => handleEditItem(item)}><EditIcon/></Button>
                             <Button variant="icon" onClick={() => handleDeleteItem(item.id)}><DeleteIcon/></Button>
                        </>
                    )}
                />
            </div>
            
            <CreditNoteItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSave={onSaveItem}
                creditNoteId={id!}
                currentItem={currentItem}
            />
        </>
    );
};

export default CreditNoteCreate;
