
import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCrud, useFetch } from '../../hooks/useCrud';
import type { CreditNote, CreditNoteItem } from '../../types';
import Button from '../../components/Button';
import { DownloadIcon, PrintIcon, EditIcon } from '../../components/icons';
import { notifyWarning } from '../../services/notification';

const DocumentHeader = ({ creditNote }: { creditNote: CreditNote }) => (
    <>
        <header className="flex justify-between items-start pb-4 border-b dark:border-gray-700">
            <div>
                <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JOFRA LTD</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Credit Note #{creditNote.code}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status: {creditNote.status}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Date: {new Date(creditNote.issue_date).toLocaleDateString()}</p>
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
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Credited to:</h3>
                <address className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                    {creditNote.customer?.name}<br/>
                    {creditNote.customer?.address}<br/>
                    {creditNote.customer?.location}, {creditNote.customer?.country}
                </address>
            </div>
        </section>
    </>
);

const ItemsTable = ({ items, currency }: { items: CreditNoteItem[], currency: string }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="p-2 text-left font-semibold text-gray-700 dark:text-gray-200">Description</th>
                    <th className="p-2 text-right font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-600">
                {items.map(item => (
                    <tr key={item.id}>
                        <td className="p-2 w-4/5">{item.description}</td>
                        <td className="p-2 text-right font-medium">{currency} {(item.credit_note_amount || 0).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const CreditNoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: creditNote, loading: cnLoading, error: cnError } = useFetch<CreditNote>(`/credit_notes/${id}`);
    const { items: creditNoteItems, loading: itemsLoading, error: itemsError } = useCrud<CreditNoteItem>(`/credit_note_items?credit_note_id=${id}`);

    // A conservative estimate of items per page to prevent overflow on a fixed-height page.
    const ITEMS_PER_PAGE = 12;

    const pages = useMemo(() => {
        if (!creditNoteItems || creditNoteItems.length === 0) {
            return [[]];
        }
        const result: CreditNoteItem[][] = [];
        for (let i = 0; i < creditNoteItems.length; i += ITEMS_PER_PAGE) {
            result.push(creditNoteItems.slice(i, i + ITEMS_PER_PAGE));
        }
        return result;
    }, [creditNoteItems]);

    const handlePrint = () => window.print();

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
            
            <div className="page-view-container">
                {pages.map((pageItems, pageIndex) => {
                    const totalPages = pages.length;
                    const isLastPage = pageIndex === totalPages - 1;

                    return (
                        <div key={pageIndex} className="page-view">
                            <div className="page-content">
                                <DocumentHeader creditNote={creditNote} />
                                <ItemsTable items={pageItems} currency={creditNote.currency} />

                                {isLastPage && (
                                    <section className="flex justify-end mt-auto pt-4">
                                        <div className="w-full max-w-xs space-y-2 text-sm">
                                            <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-2 mt-2 dark:border-gray-600">
                                                <span>Total Credit</span>
                                                <span>{creditNote.currency} {(creditNote.total_amount || 0).toFixed(2)}</span>
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

export default CreditNoteDetail;