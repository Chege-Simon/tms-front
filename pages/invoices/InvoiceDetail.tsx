import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { Invoice, InvoiceItem } from '../../types';
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

const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: invoice, loading: invoiceLoading, error: invoiceError, refetch: refetchInvoice } = useFetch<Invoice>(`/invoices/${id}`);
    const { items: invoiceItems, loading: itemsLoading, error: itemsError } = useCrud<InvoiceItem>(`/invoice_items?invoice_id=${id}`);
    
    const [currentStatus, setCurrentStatus] = useState<Invoice['status']>('Draft');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (invoice) {
            setCurrentStatus(invoice.status);
        }
    }, [invoice]);

    const handlePrint = () => {
        window.print();
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!invoice) return;
        
        const newStatus = e.target.value as Invoice['status'];
        setCurrentStatus(newStatus);
        setIsUpdating(true);
        
        const payload = {
            ...invoice,
            issue_date: formatDateForApi(invoice.issue_date),
            due_date: formatDateForApi(invoice.due_date),
            customer_id: invoice.customer?.id || invoice.customer_id,
            vehicle_id: invoice.vehicle?.id || invoice.vehicle_id,
            status: newStatus,
        };
        
        try {
            await api.put(`/invoices/${id}`, payload);
            notifySuccess('Invoice status updated successfully.');
            refetchInvoice();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status.';
            notifyError(message);
            if (invoice) {
                setCurrentStatus(invoice.status);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    if (invoiceLoading || itemsLoading) return <div className="text-center p-8">Loading invoice...</div>;
    
    const combinedError = invoiceError || itemsError;
    if (combinedError) return <div className="text-center p-8 text-red-500">Error: {combinedError.message}</div>;
    
    if (!invoice) return <div className="text-center p-8">Invoice not found.</div>;

    const itemChunks = chunkArray(invoiceItems || [], 10);
    const totalPages = itemChunks.length || 1;

    return (
        <>
            <header className="no-print flex justify-between items-center mb-6">
                <div>
                    <Link to="/invoices" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to invoices</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Invoice #{invoice.code}</h1>
                </div>
                <div className="print-controls flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}><EditIcon /> <span className="ml-2">Edit</span></Button>
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
                                        <p className="text-sm">Invoice #{invoice.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm">Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
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
                                        <h3 className="font-semibold mb-2">Invoice to:</h3>
                                        <address className="not-italic">
                                            {invoice.customer?.name}<br/>
                                            {invoice.customer?.address}<br/>
                                            {invoice.customer?.location}, {invoice.customer?.country}<br/>
                                            {invoice.customer?.phone}
                                        </address>
                                    </div>
                                </section>

                                {/* Items Table for this chunk */}
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2 text-left font-semibold">Delivery Date</th>
                                            <th className="p-2 text-left font-semibold">Destination</th>
                                            <th className="p-2 text-left font-semibold">Route</th>
                                            <th className="p-2 text-right font-semibold">Trip Charge</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chunk.map(item => (
                                            <tr key={item.id} className="border-b dark:border-gray-600">
                                                <td className="p-2">{new Date(item.delivery_date).toLocaleDateString()}</td>
                                                <td className="p-2 font-medium">{item.destination}</td>
                                                <td className="p-2 text-gray-600 dark:text-gray-400">{item.route_charge?.route || 'N/A'}</td>
                                                <td className="p-2 text-right font-medium">{invoice.currency} {parseFloat(item.actual_trip_charge || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totals - only on last page */}
                                {pageIndex === totalPages - 1 && (
                                     <section className="flex justify-end mt-8">
                                        <div className="w-full max-w-xs space-y-2 text-sm">
                                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 dark:border-gray-600">
                                                <span>Order total</span>
                                                <span>{invoice.currency} {parseFloat(invoice.total_amount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                            <div className="page-footer">Page {pageIndex + 1} of {totalPages}</div>
                        </div>
                    )) : (
                        <div className="page-view">
                          {/* Render a blank page with headers if there are no items */}
                          <p className="text-center py-10 text-gray-500">No items have been added to this invoice yet.</p>
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
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="my-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Invoice to:</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{invoice.customer?.name}</p>
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white">{invoice.currency} {(Number(invoice.total_amount) || 0).toFixed(2)}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-3 text-sm">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Details</h3>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Due date:</span><span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Payment method:</span><span className="font-medium">Bank Transfer</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Currency:</span><span className="font-medium">{invoice.currency}</span></div>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default InvoiceDetail;