
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Invoice, InvoiceItem, Driver, RouteCharge } from '../../types';
import Button from '../../components/Button';
import { DeleteIcon, PlusIcon, EditIcon } from '../../components/icons';
import api from '../../services/api';
import { useCrud, useFetch } from '../../hooks/useCrud';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { notifyError, notifySuccess } from '../../services/notification';

const InvoiceItemModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    invoiceId: string;
    currentItem: Partial<InvoiceItem> | null;
}> = ({ isOpen, onClose, onSave, invoiceId, currentItem }) => {
    const isEditMode = currentItem && currentItem.id;
    const { data: drivers, loading: driversLoading } = useFetch<Driver[]>('/drivers');
    const { data: routeCharges, loading: chargesLoading } = useFetch<RouteCharge[]>('/route_charges');

    const emptyItem: Omit<InvoiceItem, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'invoice_id' | 'code'> = {
        driver_id: '',
        route_charge_id: '',
        delivery_date: new Date().toISOString().split('T')[0],
        destination: '',
        actual_trip_charge: 0,
        actual_driver_charge: 0,
        actual_loading_charge: 0,
    };

    const [itemData, setItemData] = useState(emptyItem);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                setItemData({
                    ...emptyItem,
                    ...currentItem,
                    // FIX: Explicitly cast potential number IDs to string to match form state type.
                    driver_id: String(currentItem.driver?.id || ''),
                    // FIX: Explicitly cast potential number IDs to string to match form state type.
                    route_charge_id: String(currentItem.route_charge?.id || ''),
                    delivery_date: currentItem.delivery_date ? new Date(currentItem.delivery_date).toISOString().split('T')[0] : emptyItem.delivery_date,
                });
            } else {
                setItemData(emptyItem);
            }
        }
    }, [currentItem, isOpen, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'route_charge_id') {
            const selectedCharge = routeCharges?.find(rc => rc.id == value);
            if (selectedCharge) {
                setItemData(prev => ({
                    ...prev,
                    route_charge_id: value,
                    destination: selectedCharge.route,
                    actual_trip_charge: parseFloat(selectedCharge.trip_charge) || 0,
                    actual_driver_charge: parseFloat(selectedCharge.driver_wage) || 0,
                    actual_loading_charge: parseFloat(selectedCharge.loading_charge) || 0,
                }));
            } else {
                setItemData(prev => ({ ...prev, route_charge_id: '' }));
            }
        } else {
            const isNumeric = ['actual_trip_charge', 'actual_driver_charge', 'actual_loading_charge'].includes(name);
            setItemData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditMode) {
                await api.put(`/invoice_items/${currentItem.id}`, itemData);
            } else {
                await api.post(`/invoice_items/${invoiceId}`, itemData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save invoice item", error);
            const message = error instanceof Error ? error.message : 'Unknown error saving item.';
            notifyError(message);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit Invoice Item" : "Add Invoice Item"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Driver" name="driver_id" value={itemData.driver_id} onChange={handleChange} disabled={driversLoading} required>
                        <option value="">Select a driver</option>
                        {drivers?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                    <Select label="Route Charge" name="route_charge_id" value={itemData.route_charge_id} onChange={handleChange} disabled={chargesLoading} required>
                         <option value="">Select a route</option>
                        {routeCharges?.map(rc => <option key={rc.id} value={rc.id}>{rc.route} - KES {rc.trip_charge}</option>)}
                    </Select>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Delivery Date" name="delivery_date" type="date" value={itemData.delivery_date} onChange={handleChange} required />
                    <Input label="Destination" name="destination" value={itemData.destination} onChange={handleChange} required />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Trip Charge" name="actual_trip_charge" type="number" step="0.01" value={itemData.actual_trip_charge} onChange={handleChange} required />
                    <Input label="Driver Charge" name="actual_driver_charge" type="number" step="0.01" value={itemData.actual_driver_charge} onChange={handleChange} required />
                </div>
                <Input label="Loading Charge" name="actual_loading_charge" type="number" step="0.01" value={itemData.actual_loading_charge} onChange={handleChange} required />
                <div className="flex justify-end pt-4 mt-4 space-x-2 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};


const InvoiceEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: invoice, loading: invoiceLoading, error: invoiceError, refetch: refetchInvoice } = useFetch<Invoice>(`/invoices/${id}`);
    const { items: invoiceItems, loading: itemsLoading, error: itemsError, refetch: refetchItems } = useCrud<InvoiceItem>(`/invoice_items?invoice_id=${id}`);

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<InvoiceItem> | null>(null);

    const handleAddItem = () => {
        setCurrentItem(null);
        setIsItemModalOpen(true);
    };

    const handleEditItem = (item: InvoiceItem) => {
        setCurrentItem(item);
        setIsItemModalOpen(true);
    };
    
    const handleDeleteItem = async (itemId: string | number) => {
        try {
            await api.del(`/invoice_items/${itemId}`);
            notifySuccess('Item deleted successfully.');
            refetchItems();
            refetchInvoice();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete item.';
            notifyError(message);
            console.error("Failed to delete item:", error);
        }
    };
    
    const onSaveItem = () => {
        refetchItems();
        refetchInvoice(); // To update total amount
    };

    const columns = useMemo((): Column<InvoiceItem>[] => [
        { header: 'Date', accessor: (item) => new Date(item.delivery_date).toLocaleDateString() },
        { header: 'Destination', accessor: 'destination'},
        { header: 'Driver', accessor: (item) => item.driver?.name || 'N/A' },
        { header: 'Route', accessor: (item) => item.route_charge?.route || 'N/A' },
        { header: 'Trip Charge', accessor: (item) => `${invoice?.currency || 'KES'} ${item.actual_trip_charge.toFixed(2)}` },
    ], [invoice?.currency]);

    if (invoiceLoading) return <div>Loading Invoice...</div>;
    if (invoiceError) return <div className="text-red-500">Error loading invoice: {invoiceError.message}</div>;
    if (!invoice) return <div>Invoice not found.</div>;
    
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <Link to="/invoices" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to invoices</Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">Edit Invoice {invoice.code}</h1>
                </div>
            </div>

            {/* Invoice Header Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700">Invoice Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong className="block text-gray-500">Customer:</strong> {invoice.customer?.name}</div>
                    <div><strong className="block text-gray-500">Vehicle:</strong> {invoice.vehicle?.brand} ({invoice.vehicle?.registration_number})</div>
                    <div><strong className="block text-gray-500">Issue Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</div>
                    <div><strong className="block text-gray-500">Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</div>
                    <div><strong className="block text-gray-500">Status:</strong> {invoice.status}</div>
                    <div><strong className="block text-gray-500">Total Amount:</strong> <span className="font-bold text-base">{invoice.currency} {invoice.total_amount.toFixed(2)}</span></div>
                </div>
            </div>

            {/* Invoice Items Section */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Invoice Items</h2>
                    <Button onClick={handleAddItem}><PlusIcon/> Add Item</Button>
                </div>
                <DataTable 
                    columns={columns}
                    data={invoiceItems}
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
            
            <InvoiceItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSave={onSaveItem}
                invoiceId={id!}
                currentItem={currentItem}
            />
        </>
    );
};

export default InvoiceEdit;
