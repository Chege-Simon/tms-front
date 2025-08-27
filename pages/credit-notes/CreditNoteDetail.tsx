
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { CreditNote, CreditNoteItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning, notifySuccess, notifyError } from '../../services/notification';
import api from '../../services/api';
import { formatDateForApi } from '../../services/datetime';

const CreditNoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: creditNote, loading: cnLoading, error: cnError, refetch: refetchCreditNote } = useFetch<CreditNote>(`/credit_notes/${id}`);
    const { items: creditNoteItems, loading: itemsLoading, error: itemsError } = useCrud<CreditNoteItem>(`/credit_note_items?credit_note_id=${id}`);
    
    const [currentStatus, setCurrentStatus] = useState<CreditNote['status']>('Draft');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (creditNote) {
            setCurrentStatus(creditNote.status);
        }
    }, [creditNote]);

    const handlePrint = () => window.print();

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!creditNote) return;
        
        const newStatus = e.target.value as CreditNote['status'];
        setCurrentStatus(newStatus);
        setIsUpdating(true);
        
        const payload = {
            issue_date: formatDateForApi(creditNote.issue_date),
            customer_id: creditNote.customer?.id || creditNote.customer_id,
            currency: creditNote.currency,
            total_amount: creditNote.total_amount || 0,
            status: newStatus,
        };
        
        try {
            await api.put(`/credit_notes/${id}`, payload);
            notifySuccess('Status updated successfully.');
            refetchCreditNote();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status.';
            notifyError(message);
            if (creditNote) setCurrentStatus(creditNote.status);
        } finally {
            setIsUpdating(false);
        }
    };

    if (cnLoading || itemsLoading) return <div className="text-center p-8">Loading...</div>;
    const combinedError = cnError || itemsError;
    if (combinedError) return <div className="text-center p-8 text-red-500">Error: {combinedError.message}</div>;
    if (!creditNote) return <div className="text-center p-8">Credit Note not found.</div>;

    return (
        <>
            <header className="no-print flex justify-between items-center mb-6">
                <div>
                    <Link to="/credit-notes" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to credit notes</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Credit Note #{creditNote.code}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/credit-notes/${id}/edit`)}><EditIcon /> <span className="ml-2">Edit</span></Button>
                    <Button variant="secondary" onClick={handlePrint}><PrintIcon /> <span className="ml-2">Print</span></Button>
                    <Button onClick={() => notifyWarning('PDF Download not implemented.')}><DownloadIcon /> <span className="ml-2">Download</span></Button>
                </div>
            </header>
            
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="print-area lg:flex-1 bg-white dark:bg-gray-800 p-8 lg:p-12 shadow-lg rounded-lg">
                   <header className="flex justify-between items-start pb-8 border-b dark:border-gray-700">
                        <div>
                            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">FleetFlow</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Credit Note #{creditNote.code}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(creditNote.issue_date).toLocaleDateString()}</p>
                        </div>
                    </header>
                    <section className="my-8">
                         <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Credited to:</h3>
                        <address className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                            {creditNote.customer?.name}<br/>
                            {creditNote.customer?.address}<br/>
                            {creditNote.customer?.location}, {creditNote.customer?.country}
                        </address>
                    </section>
                    <section>
                         <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Description</th>
                                        <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-600">
                                    {creditNoteItems?.map(item => (
                                        <tr key={item.id}>
                                            <td className="p-3">{item.description}</td>
                                            <td className="p-3 text-right font-medium">{creditNote.currency} {(item.credit_note_amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </section>
                    <section className="flex justify-end mt-8">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-2 mt-2 dark:border-gray-600">
                                <span>Total Credit</span>
                                <span>{creditNote.currency} {(creditNote.total_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="no-print lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <label htmlFor="status" className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Status:</label>
                            <select
                                id="status"
                                value={currentStatus}
                                onChange={handleStatusChange}
                                disabled={isUpdating}
                                className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Issued">Issued</option>
                                <option value="Applied">Applied</option>
                            </select>
                        </div>
                        <div className="my-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Customer:</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{creditNote.customer?.name}</p>
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white">{creditNote.currency} {(creditNote.total_amount || 0).toFixed(2)}</p>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default CreditNoteDetail;
