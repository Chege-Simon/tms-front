import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { CreditNote, CreditNoteItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning, notifySuccess, notifyError } from '../../services/notification';
import api from '../../services/api';
import { formatDateForApi } from '../../services/datetime';

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

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

    const handlePrint = () => {
        window.print();
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!creditNote) return;
        
        const newStatus = e.target.value as CreditNote['status'];
        setCurrentStatus(newStatus);
        setIsUpdating(true);
        
        const payload = {
            ...creditNote,
            issue_date: formatDateForApi(creditNote.issue_date),
            customer_id: creditNote.customer?.id || creditNote.customer_id,
            status: newStatus,
        };
        
        try {
            await api.put(`/credit_notes/${id}`, payload);
            notifySuccess('Credit Note status updated successfully.');
            refetchCreditNote();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status.';
            notifyError(message);
            if (creditNote) {
                setCurrentStatus(creditNote.status);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    if (cnLoading || itemsLoading) return <div className="text-center p-8">Loading...</div>;
    const combinedError = cnError || itemsError;
    if (combinedError) return <div className="text-center p-8 text-red-500">Error: {combinedError.message}</div>;
    if (!creditNote) return <div className="text-center p-8">Credit Note not found.</div>;

    const itemChunks = chunkArray(creditNoteItems || [], 10);
    const totalPages = itemChunks.length || 1;

    return (
        <>
            <header className="no-print flex justify-between items-center mb-6">
                <div>
                    <Link to="/credit-notes" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to credit notes</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Credit Note #{creditNote.code}</h1>
                </div>
                <div className="print-controls flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/credit-notes/${id}/edit`)}><EditIcon /> <span className="ml-2">Edit</span></Button>
                    <Button variant="secondary" onClick={handlePrint}><PrintIcon /> <span className="ml-2">Print</span></Button>
                    <Button onClick={() => notifyWarning('PDF Download not implemented.')}><DownloadIcon /> <span className="ml-2">Download</span></Button>
                </div>
            </header>
            
            <div className="flex flex-col lg:flex-row gap-8">
                <main className="lg:flex-1 page-container">
                    {itemChunks.length > 0 ? itemChunks.map((chunk, pageIndex) => (
                        <div key={pageIndex} className="page-view">
                            <div className="page-content">
                                {/* Repeating Header */}
                                <header className="flex justify-between items-start pb-4 border-b dark:border-gray-600">
                                    <div>
                                        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JOFRA LTD</h2>
                                        <p className="text-sm">Credit Note #{creditNote.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">Date: {new Date(creditNote.issue_date).toLocaleDateString()}</p>
                                    </div>
                                </header>
                                <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                                    <div>
                                        <h3 className="font-semibold mb-2">Pay to:</h3>
                                        <address className="not-italic">
                                            JOFRA LTD<br/>
                                            1462-0232, Ruiru<br/>
                                            Kenya<br/>
                                            VAT Code: AA-1234567890<br/>
                                            KRA PIN: P1234567890D
                                        </address>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-semibold mb-2">Credited to:</h3>
                                        <address className="not-italic">
                                            {creditNote.customer?.name}<br/>
                                            {creditNote.customer?.address}<br/>
                                            {creditNote.customer?.location}, {creditNote.customer?.country}
                                        </address>
                                    </div>
                                </section>

                                {/* Items Table for this chunk */}
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2 text-left font-semibold">Description</th>
                                            <th className="p-2 text-right font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chunk.map(item => (
                                            <tr key={item.id} className="border-b dark:border-gray-600">
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2 text-right font-medium">{creditNote.currency} {parseFloat(item.credit_note_amount || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals - only on last page */}
                                {pageIndex === totalPages - 1 && (
                                    <section className="flex justify-end mt-8">
                                        <div className="w-full max-w-xs space-y-2 text-sm">
                                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 dark:border-gray-600">
                                                <span>Total Credit</span>
                                                <span>{creditNote.currency} {parseFloat(creditNote.total_amount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                            <div className="page-footer">Page {pageIndex + 1} of {totalPages}</div>
                        </div>
                    )) : (
                        <div className="page-view">
                          <p className="text-center py-10 text-gray-500">No items have been added to this credit note yet.</p>
                        </div>
                    )}
                </main>

                {/* Sidebar for screen only */}
                <aside className="no-print lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <label htmlFor="status" className="text-sm font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Status:</label>
                            <select
                                id="status"
                                value={currentStatus}
                                onChange={handleStatusChange}
                                disabled={isUpdating}
                                className="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Issued">Issued</option>
                                <option value="Applied">Applied</option>
                            </select>
                        </div>
                        <div className="my-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Credited to:</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{creditNote.customer?.name}</p>
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white">{creditNote.currency} {(Number(creditNote.total_amount) || 0).toFixed(2)}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-3 text-sm">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Details</h3>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Issue date:</span><span className="font-medium">{new Date(creditNote.issue_date).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Currency:</span><span className="font-medium">{creditNote.currency}</span></div>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default CreditNoteDetail;