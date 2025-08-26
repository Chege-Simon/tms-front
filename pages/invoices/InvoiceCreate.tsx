
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFetch, useCrud } from '../../hooks/useCrud';
import type { Customer, Invoice, InvoiceItem } from '../../types';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import { DeleteIcon, PlusIcon } from '../../components/icons';
import api from '../../services/api';

const emptyItem: Omit<InvoiceItem, 'id' | 'invoice_id'> = { product_name: '', unit_price: 0, quantity: 1, discount: 0 };

const InvoiceCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    currency: 'USD',
    vat_applicable: false,
    shipping_estimate: 0,
    tax: 0,
  });
  const [items, setItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id'>[]>([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const { data: customers, loading: customersLoading } = useFetch<Customer[]>('/customers');
  const { addItem, updateItem } = useCrud<Invoice>('/invoices');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
        setLoading(true);
        api.get<Invoice>(`/invoices/${id}`)
            .then(data => {
                setInvoice(data);
                setItems(data.invoice_items);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);
  
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setInvoice(prev => ({ ...prev, [name]: val }));
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (newItem.product_name && newItem.quantity > 0 && newItem.unit_price >= 0) {
      setItems(prev => [...prev, newItem]);
      setNewItem(emptyItem);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const { subtotal, total } = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
        const itemTotal = item.unit_price * item.quantity * (1 - (item.discount || 0) / 100);
        return acc + itemTotal;
    }, 0);
    const total = subtotal + (invoice.tax || 0) + (invoice.shipping_estimate || 0);
    return { subtotal, total };
  }, [items, invoice.tax, invoice.shipping_estimate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalInvoiceData = {
        ...invoice,
        subtotal,
        total_amount: total,
        invoice_items: items,
    };

    try {
        if(isEditMode) {
            await updateItem(finalInvoiceData as Invoice);
        } else {
            await addItem(finalInvoiceData as Omit<Invoice, 'id'>);
        }
        navigate('/invoices');
    } catch(err) {
        console.error("Failed to save invoice", err);
        alert("Error: Could not save invoice.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <div className="mb-8">
        <Link to="/invoices" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to invoices</Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{isEditMode ? 'Edit Invoice' : 'New Invoice'}</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
                <Input label="Invoice Number*" name="invoice_number" value={invoice.invoice_number || ''} onChange={handleInvoiceChange} required/>
                <Select label="Payment Condition" name="payment_condition" value={invoice.payment_condition || ''} onChange={handleInvoiceChange}>
                    <option value="">Select condition</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option>
                    <option value="due_on_receipt">Due on receipt</option>
                </Select>
                <Input label="Issue Date*" name="issue_date" type="date" value={invoice.issue_date?.split('T')[0] || ''} onChange={handleInvoiceChange} required/>
                <Input label="Delivery Date" name="delivery_date" type="date" value={invoice.delivery_date?.split('T')[0] || ''} onChange={handleInvoiceChange} />
            </div>
            <div className="space-y-6">
                <Select label="Customer*" name="customer_id" value={invoice.customer_id || ''} onChange={handleInvoiceChange} required disabled={customersLoading}>
                    <option value="">Select customer</option>
                    {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select label="Currency" name="currency" value={invoice.currency || 'USD'} onChange={handleInvoiceChange}>
                    <option value="USD">United States Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                </Select>
                <Input label="Due Date*" name="due_date" type="date" value={invoice.due_date?.split('T')[0] || ''} onChange={handleInvoiceChange} required/>
                <Input label="Reference of the invoice" name="reference" value={invoice.reference || ''} onChange={handleInvoiceChange} />
            </div>
        </div>

        <div className="space-y-6 mb-8">
            <Input label="Object" name="object" placeholder="Invoice subject" value={invoice.object || ''} onChange={handleInvoiceChange} />
            <Textarea label="Additional info" name="additional_info" rows={4} placeholder="Receipt info (optional)" value={invoice.additional_info || ''} onChange={handleInvoiceChange} />
        </div>

        <div className="flex items-center space-x-2 mb-6">
            <input type="checkbox" id="vat_applicable" name="vat_applicable" checked={invoice.vat_applicable || false} onChange={handleInvoiceChange} className="rounded" />
            <label htmlFor="vat_applicable" className="text-sm font-medium text-gray-700 dark:text-gray-300">VAT Applicable</label>
        </div>

        {/* Items Table */}
        <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Items</h2>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300">Product Name</th>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300">Price</th>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300">Quantity</th>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300">Discount (%)</th>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300">Total Price</th>
                            <th className="p-3 text-left font-medium text-gray-600 dark:text-gray-300"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {items.map((item, index) => {
                            const total = item.unit_price * item.quantity * (1 - (item.discount || 0) / 100);
                            return (
                                <tr key={index}>
                                    <td className="p-3 text-gray-800 dark:text-gray-200">{item.product_name}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-200">${item.unit_price.toFixed(2)}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-200">{item.quantity}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-200">{item.discount}%</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-200">${total.toFixed(2)}</td>
                                    <td className="p-3">
                                        <Button type="button" variant="icon" onClick={() => handleRemoveItem(index)}><DeleteIcon /></Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* New Item Row */}
                        <tr>
                           <td className="p-2"><Input label="" id="product_name" name="product_name" placeholder="Product name" value={newItem.product_name} onChange={handleNewItemChange} /></td>
                           <td className="p-2"><Input label="" id="unit_price" name="unit_price" placeholder="Price" type="number" step="0.01" value={newItem.unit_price} onChange={handleNewItemChange} /></td>
                           <td className="p-2"><Input label="" id="quantity" name="quantity" placeholder="1" type="number" value={newItem.quantity} onChange={handleNewItemChange} /></td>
                           <td className="p-2"><Input label="" id="discount" name="discount" placeholder="0" type="number" value={newItem.discount} onChange={handleNewItemChange} /></td>
                           <td className="p-2"></td>
                           <td className="p-2"><Button type="button" onClick={handleAddItem}>Save product</Button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Order summary</h3>
                <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span>Tax</span>
                    <div className="w-24"><Input label="" id="tax" name="tax" type="number" step="0.01" value={invoice.tax || 0} onChange={handleInvoiceChange} /></div>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                    <span>Shipping estimate</span>
                    <div className="w-24"><Input label="" id="shipping_estimate" name="shipping_estimate" type="number" step="0.01" value={invoice.shipping_estimate || 0} onChange={handleInvoiceChange} /></div>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-3 dark:border-gray-600"><span>Order total</span><span>${total.toFixed(2)}</span></div>
                 <div className="flex justify-end pt-4">
                    <Button type="submit">{isEditMode ? 'Update Invoice' : 'Create Invoice'}</Button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreate;
