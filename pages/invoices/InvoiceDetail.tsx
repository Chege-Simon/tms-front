
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useCrud';
import type { Invoice } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';

const InvoiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: invoice, loading, error } = useFetch<Invoice>(`/invoices/${id}`);
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="text-center p-8">Loading invoice...</div>;
    if (error) return <div className="text-center p-8 text-red-500">Error: {error.message}</div>;
    if (!invoice) return <div className="text-center p-8">Invoice not found.</div>;
    
    const getStatusChip = (status: Invoice['status']) => {
        const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block";
        const statusClasses = {
            Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            Overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
        return <div className={`${baseClasses} ${statusClasses[status]}`}>{status}</div>;
    };

    return (
        <>
            {/* Header for screen only */}
            <header className="no-print flex justify-between items-center mb-6">
                <div>
                    <Link to="/invoices" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to invoices</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Invoice #{invoice.invoice_number}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate(`/invoices/${id}/edit`)}><EditIcon /> <span className="ml-2">Edit</span></Button>
                    <Button variant="secondary" onClick={handlePrint}><PrintIcon /> <span className="ml-2">Print</span></Button>
                    <Button onClick={() => alert('PDF Download not implemented.')}><DownloadIcon /> <span className="ml-2">Download</span></Button>
                </div>
            </header>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content (Printable Area) */}
                <div className="print-area lg:flex-1 bg-white dark:bg-gray-800 p-8 lg:p-12 shadow-lg rounded-lg">
                   <header className="flex justify-between items-start pb-8 border-b dark:border-gray-700">
                        <div>
                            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">FleetFlow</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Invoice #{invoice.invoice_number}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        </div>
                    </header>
                    <section className="grid grid-cols-2 gap-8 my-8">
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pay to:</h3>
                            <address className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                                FleetFlow LLC<br/>
                                123 Transport Lane<br/>
                                Anytown, USA 12345<br/>
                                VAT Code: AA-1234567890
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
                    <section>
                         <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Product Name</th>
                                        <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">Price</th>
                                        <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">Quantity</th>
                                        <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">Discount</th>
                                        <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">Total Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-600">
                                    {invoice.invoice_items.map(item => {
                                        const total = item.unit_price * item.quantity * (1 - item.discount / 100);
                                        return (
                                        <tr key={item.id}>
                                            <td className="p-3">
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{item.product_name}</p>
                                                {item.description && <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>}
                                            </td>
                                            <td className="p-3 text-right">${item.unit_price.toFixed(2)}</td>
                                            <td className="p-3 text-right">{item.quantity}</td>
                                            <td className="p-3 text-right">{item.discount}%</td>
                                            <td className="p-3 text-right font-medium">${total.toFixed(2)}</td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                         </div>
                    </section>
                    <section className="flex justify-end mt-8">
                        <div className="w-full max-w-xs space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>${invoice.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax</span><span>${invoice.tax.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping estimate</span><span>${invoice.shipping_estimate.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-2 mt-2 dark:border-gray-600"><span>Order total</span><span>${invoice.total_amount.toFixed(2)}</span></div>
                        </div>
                    </section>
                </div>

                {/* Sidebar for screen only */}
                <aside className="no-print lg:w-80 flex-shrink-0 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                        {getStatusChip(invoice.status)}
                        <div className="my-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Invoice to:</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{invoice.customer?.name}</p>
                        </div>
                        <p className="text-4xl font-bold text-gray-800 dark:text-white">${invoice.total_amount.toFixed(2)}</p>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-3 text-sm">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Details</h3>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Due date:</span><span className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Payment method:</span><span className="font-medium">Bank Transfer</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Currency:</span><span className="font-medium">{invoice.currency}</span></div>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-sm">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-4">Timeline</h3>
                        <ol className="relative border-l border-gray-200 dark:border-gray-700">                  
                            <li className="mb-6 ml-4">
                                <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-800 dark:bg-gray-700"></div>
                                <time className="mb-1 text-xs font-normal leading-none text-gray-400 dark:text-gray-500">{new Date(invoice.created_at || Date.now()).toLocaleDateString()}</time>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Invoice created</h3>
                            </li>
                             <li className="mb-6 ml-4">
                                <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-800 dark:bg-gray-700"></div>
                                <time className="mb-1 text-xs font-normal leading-none text-gray-400 dark:text-gray-500">{new Date(invoice.created_at || Date.now()).toLocaleDateString()}</time>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Invoice sent</h3>
                            </li>
                            {invoice.status === 'Paid' && (
                                <li className="ml-4">
                                    <div className="absolute w-3 h-3 bg-green-500 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-800"></div>
                                    <time className="mb-1 text-xs font-normal leading-none text-gray-400 dark:text-gray-500">Some date</time>
                                    <h3 className="font-semibold text-green-600 dark:text-green-400">Invoice paid</h3>
                                </li>
                            )}
                        </ol>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default InvoiceDetail;
