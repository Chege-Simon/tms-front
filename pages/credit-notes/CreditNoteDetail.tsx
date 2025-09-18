
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import { DownloadIcon, EditIcon, PrintIcon } from '../../components/icons';
import { useCrud, useFetch } from '../../hooks/useCrud';
import api from '../../services/api';
import { formatDateForApi } from '../../services/datetime';
import { notifyError, notifySuccess, notifyWarning } from '../../services/notification';
import type { CreditNote, CreditNoteItem } from '../../types';

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

    const PrintableView = () => (
         <div className="printable-area">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <td className="py-4 align-top">
                            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JOFRA LTD</h2>
                            <p className="text-gray-500 dark:text-gray-400">Credit Note #{creditNote.code}</p>
                            <p className="text-gray-500 dark:text-gray-400">Status: {creditNote.status}</p>
                        </td>
                        <td className="py-4 align-top text-right">
                            <p className="text-gray-500 dark:text-gray-400">Date: {new Date(creditNote.issue_date).toLocaleDateString()}</p>
                        </td>
                    </tr>
                    <tr>
                        <td className="pt-6 pb-8 align-top">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pay to:</h3>
                            <address className="text-gray-600 dark:text-gray-400 not-italic">
                                JOFRA LTD<br/>
                                1462-0232, Ruiru<br/>
                                Kenya<br/>
                                VAT Code: AA-1234567890<br/>
                                KRA PIN: P1234567890D
                            </address>
                        </td>
                        <td className="pt-6 pb-8 align-top text-right">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Credited to:</h3>
                            <address className="text-gray-600 dark:text-gray-400 not-italic">
                                {creditNote.customer?.name}<br/>
                                {creditNote.customer?.address}<br/>
                                {creditNote.customer?.location}, {creditNote.customer?.country}
                            </address>
                        </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200 w-4/5">Description</th>
                        <th className="p-2 text-right font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                    </tr>
                </thead>
                
                <tbody>
                    {(creditNoteItems || []).map(item => (
                        <tr key={item.id}>
                            <td className="p-2 border-b dark:border-gray-700">{item.description}</td>
                            <td className="p-2 text-right font-medium border-b dark:border-gray-700">{creditNote.currency} {parseFloat(item.credit_note_amount || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr>
                        <td colSpan={2}>
                            <div className="mt-8 pt-4 border-t dark:border-gray-700 text-right">
                                <div className="inline-block w-full max-w-xs space-y-2 text-left">
                                    <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                                        <span>Total Credit</span>
                                        <span>{creditNote.currency} {parseFloat(creditNote.total_amount || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );

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
                {/* On-screen visible version */}
                <div className="lg:flex-1 bg-white dark:bg-gray-800 p-8 shadow-md rounded-lg">
                    <PrintableView />
                </div>

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


            {/* Hidden, print-only version */}
            <div id="cn-print-content" className="hidden">
                <PrintableView />
            </div>
        </>
    );
};

export default CreditNoteDetail;
