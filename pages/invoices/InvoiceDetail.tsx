
import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { Invoice, InvoiceItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning } from '../../services/notification';

const DocumentHeader = ({ invoice }: { invoice: Invoice }) => (
    <>
        <header className="flex justify-between items-start pb-4 border-b dark:border-gray-700">
            <div>
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JOFRA LTD</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice #{invoice.code}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status: {invoice.status}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
        </header>
        <section className="grid grid-cols-2 gap-8 my-4">
            <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pay to:</h3>
                <address className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                    JOFRA LTD<br/>
                    1462-0232, Ruiru<br/>
                    Kenya<br/>
                    VAT Code: AA-1234567890<br/>
                    KRA PIN: P1234567890D
                </address>
            </div>
            <div className="text-right">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Invoice to:</h3>
                <address className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                    {invoice.customer?.name}<br/>
                    {invoice.customer?.address}<br/>
                    {invoice.customer?.location}, {invoice.customer?.country}<br/>
                    {invoice.customer?.phone}
                </address>
            </div>
        </section>
    </>
);

const ItemsTable = ({ items, currency }: { items: InvoiceItem[], currency: string }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Delivery Date</th>
                    <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Destination</th>
                    <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Driver</th>
                    <th className="p-2 text-right font-semibold text-gray-700 dark:text-gray-200">Trip Charge</th>
                </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-600">
                {items.map(item => (
                    <tr key={item.id}>
                        <td className="p-2">{new Date(item.delivery_date).toLocaleDateString()}</td>
                        <td className="p-2">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.destination}</p>
                            {item.route_charge && <p className="text-xs text-gray-500 dark:text-gray-400">{item.route_charge.route}</p>}
                        </td>
                        <td className="p-2">{item.driver?.name}</td>
                        <td className="p-2 text-right font-medium">{currency} {Number(item.actual_trip_charge || 0).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: invoice, loading: invoiceLoading, error: invoiceError } = useFetch<Invoice>(`/invoices/${id}`);
    const { items: invoiceItems, loading: itemsLoading, error: itemsError } = useCrud<InvoiceItem>(`/invoice_items?invoice_id=${id}`);

    // A conservative estimate of items per page to prevent overflow on a fixed-height page.
    const ITEMS_PER_PAGE = 10;

    const pages = useMemo(() => {
        if (!invoiceItems || invoiceItems.length === 0) {
            return [[]]; // Ensure there's at least one page even if there are no items
        }
        const result: InvoiceItem[][] = [];
        for (let i = 0; i < invoiceItems.length; i += ITEMS_PER_PAGE) {
            result.push(invoiceItems.slice(i, i + ITEMS_PER_PAGE));
        }
        return result;
    }, [invoiceItems]);

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
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}><EditIcon /> <span className="ml-2">Edit</span></Button>
                    <Button variant="secondary" onClick={handlePrint}><PrintIcon /> <span className="ml-2">Print</span></Button>
                    <Button onClick={() => notifyWarning('PDF Download not implemented.')}><DownloadIcon /> <span className="ml-2">Download</span></Button>
                </div>
            </header>
            
            <div className="page-view-container">
                {pages.map((pageItems, pageIndex) => {
                    const totalPages = pages.length;
                    const isLastPage = pageIndex === totalPages - 1;

                    return (
                        <div key={pageIndex} className="page-view">
                            <div className="page-content">
                                <DocumentHeader invoice={invoice} />
                                <ItemsTable items={pageItems} currency={invoice.currency} />

                                {isLastPage && (
                                    <section className="flex justify-end mt-auto pt-4">
                                        <div className="w-full max-w-xs space-y-2 text-sm">
                                            <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-2 mt-2 dark:border-gray-600">
                                                <span>Order total</span>
                                                <span>{invoice.currency} {parseFloat(invoice.total_amount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                            <div className="page-view-footer">
                                Page {pageIndex + 1} of {totalPages}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default InvoiceDetail;