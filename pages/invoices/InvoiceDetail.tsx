import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { Invoice, InvoiceItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning } from '../../services/notification';

const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: invoice, loading: invoiceLoading, error: invoiceError } = useFetch<Invoice>(`/invoices/${id}`);
    const { items: invoiceItems, loading: itemsLoading, error: itemsError } = useCrud<InvoiceItem>(`/invoice_items?invoice_id=${id}`);

    const handlePrint = () => {
        window.print();
    };

    if (invoiceLoading || itemsLoading) return <div className="text-center p-8">Loading invoice...</div>;
    
    const combinedError = invoiceError || itemsError;
    if (combinedError) return <div className="text-center p-8 text-red-500">Error: {combinedError.message}</div>;
    
    if (!invoice) return <div className="text-center p-8">Invoice not found.</div>;

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
            
            <div className="printable-area bg-white dark:bg-gray-800 p-8 shadow-md rounded-lg">
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
        </>
    );
};

export default InvoiceDetail;