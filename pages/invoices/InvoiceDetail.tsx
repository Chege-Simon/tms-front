

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { Invoice, InvoiceItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning, notifySuccess, notifyError } from '../../services/notification';
import api from '../../services/api';
import { formatDateForApi } from '../../services/datetime';

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
            issue_date: formatDateForApi(invoice.issue_date),
            due_date: formatDateForApi(invoice.due_date),
            customer_id: invoice.customer?.id || invoice.customer_id,
            vehicle_id: invoice.vehicle?.id || invoice.vehicle_id,
            currency: invoice.currency,
            total_amount: invoice.total_amount || 0,
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

     const PrintableView = () => (
        <div className="printable-area">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <td colSpan={2} className="py-4 align-top">
                            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JOFRA LTD</h2>
                            <p className="text-gray-500 dark:text-gray-400">Invoice #{invoice.code}</p>
                            <p className="text-gray-500 dark:text-gray-400">Status: {invoice.status}</p>
                        </td>
                        <td colSpan={2} className="py-4 align-top text-right">
                            <p className="text-gray-500 dark:text-gray-400">Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="pt-6 pb-8 align-top">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pay to:</h3>
                            <address className="text-gray-600 dark:text-gray-400 not-italic">
                                JOFRA LTD<br/>
                                1462-0232, Ruiru<br/>
                                Kenya<br/>
                                VAT Code: AA-1234567890<br/>
                                KRA PIN: P1234567890D
                            </address>
                        </td>
                        <td colSpan={2} className="pt-6 pb-8 align-top text-right">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Invoice to:</h3>
                            <address className="text-gray-600 dark:text-gray-400 not-italic">
                                {invoice.customer?.name}<br/>
                                {invoice.customer?.address}<br/>
                                {invoice.customer?.location}, {invoice.customer?.country}<br/>
                                {invoice.customer?.phone}
                            </address>
                        </td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Delivery Date</th>
                        <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Destination</th>
                        <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Driver</th>
                        <th className="p-2 text-right font-semibold text-gray-700 dark:text-gray-200">Trip Charge</th>
                    </tr>
                </thead>
                
                <tbody>
                    {(invoiceItems || []).map(item => (
                        <tr key={item.id}>
                            <td className="p-2 border-b dark:border-gray-700">{new Date(item.delivery_date).toLocaleDateString()}</td>
                            <td className="p-2 border-b dark:border-gray-700">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{item.destination}</p>
                                {item.route_charge && <p className="text-xs text-gray-500 dark:text-gray-400">{item.route_charge.route}</p>}
                            </td>
                            <td className="p-2 border-b dark:border-gray-700">{item.driver?.name}</td>
                            <td className="p-2 text-right font-medium border-b dark:border-gray-700">{invoice.currency} {parseFloat(item.actual_trip_charge || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr>
                        <td colSpan={4}>
                             <div className="mt-8 pt-4 border-t dark:border-gray-700 text-right">
                                <div className="inline-block w-full max-w-xs space-y-2 text-left">
                                    <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                                        <span>Order total</span>
                                        <span>{invoice.currency} {parseFloat(invoice.total_amount || 0).toFixed(2)}</span>
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

            {/* Hidden, print-only version */}
            <div id="invoice-print-content" className="hidden">
                <PrintableView />
            </div>
        </>
    );
};

export default InvoiceDetail;
