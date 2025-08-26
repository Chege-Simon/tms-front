
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Customer, Invoice, InvoiceItem } from '../../types';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import { DeleteIcon, PlusIcon } from '../../components/icons';
import api from '../../services/api';

const emptyItem: InvoiceItem = { product_name: '', unit_price: 0, quantity: 1, discount: 0, description: '' };

const InvoiceCreate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoice_number: `FWR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    customer_id: '',
    currency: 'USD',
    payment_condition: 'net_30',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_date: '',
    reference: '',
    object: '',
    additional_info: '',
    vat_applicable: false,
    status: 'Draft',
  });
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_name: 'Flowbite Developer Edition', description: 'HTML, JS, Figma', unit_price: 269, quantity: 2, discount: 50 },
    { product_name: 'Flowbite Designer Edition', description: 'Figma Design System', unit_price: 149, quantity: 3, discount: 0 },
  ]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const fetchCustomers = useCallback(async () => {
    try {
        const response: any = await api.get('/customers');
        const customerData = response?.data?.data || response.data || response || [];
        setCustomers(customerData);
        if (!isEditMode && customerData.length > 0) {
            setInvoice(prev => ({ ...prev, customer_id: customerData[0].id }));
        }
    } catch (error) {
        console.error("Failed to fetch customers", error);
    }
  }, [isEditMode]);

  const fetchInvoice = useCallback(async (invoiceId: string) => {
    try {
        const invoiceData: any = await api.get(`/invoices/${invoiceId}`);
        const fetchedInvoice = invoiceData.data || invoiceData;
        setInvoice({
            ...fetchedInvoice,
            issue_date: fetchedInvoice.issue_date?.split('T')[0] || '',
            due_date: fetchedInvoice.due_date?.split('T')[0] || '',
            delivery_date: fetchedInvoice.delivery_date ? fetchedInvoice.delivery_date.split('T')[0] : '',
        });
        setItems(fetchedInvoice.invoice_items || []);
    } catch (error) {
        console.error("Failed to fetch invoice", error);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);
        await fetchCustomers();
        if (isEditMode) {
            await fetchInvoice(id);
        }
        setLoading(false);
    }
    loadInitialData();
  }, [id, isEditMode, fetchCustomers, fetchInvoice]);
  
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setInvoice(prev => ({ ...prev, [name]: val }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const itemToUpdate = { ...newItems[index] };
    
    if (field === 'unit_price' || field === 'quantity' || field === 'discount') {
      (itemToUpdate as any)[field] = parseFloat(value as string) || 0;
    } else {
      (itemToUpdate as any)[field] = value;
    }

    newItems[index] = itemToUpdate;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { ...emptyItem, id: `new-${Date.now()}` }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const { subtotal, tax, shipping, total } = useMemo(() => {
    const sub = items.reduce((acc, item) => {
        const itemPrice = Number(item.unit_price) || 0;
        const itemQty = Number(item.quantity) || 0;
        const itemDiscount = Number(item.discount) || 0;
        const itemTotal = itemPrice * itemQty * (1 - itemDiscount / 100);
        return acc + itemTotal;
    }, 0);
    
    // Using hardcoded tax and shipping for demo as they are not form fields
    const taxAmount = 477; // Example value from mockup
    const shippingAmount = 0; // Example value from mockup
    
    const grandTotal = sub + taxAmount + shippingAmount;

    return { subtotal: sub, tax: taxAmount, shipping: shippingAmount, total: grandTotal };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice.customer_id) {
        alert("Please select a customer.");
        return;
    }
    setSaving(true);
    const finalInvoiceData = {
        ...invoice,
        subtotal,
        tax,
        shipping_estimate: shipping,
        total_amount: total,
        invoice_items: items.map(({id, ...rest}) => rest), // API shouldn't receive temporary client-side IDs
    };

    try {
        if(isEditMode) {
            await api.put(`/invoices/${id}`, finalInvoiceData);
        } else {
            await api.post('/invoices', finalInvoiceData);
        }
        navigate('/invoices');
    } catch(err) {
        console.error("Failed to save invoice:", err);
        alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
        setSaving(false);
    }
  };

  if(loading) {
    return <div className="text-center p-8">Loading form...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
        <div className="flex justify-between items-center mb-6">
             <div>
                <Link to="/invoices" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to invoices</Link>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{isEditMode ? 'Edit Invoice' : 'New Invoice'}</h1>
            </div>
            <div className="flex items-center space-x-2">
                 <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
                 <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Invoice'}</Button>
            </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-8">
            {/* Top section: Invoice #, Customer, etc. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Invoice Number*" id="invoice_number" name="invoice_number" value={invoice.invoice_number || ''} onChange={handleInvoiceChange} required />
                <Select label="Customer*" id="customer_id" name="customer_id" value={invoice.customer_id || ''} onChange={handleInvoiceChange} required>
                    <option value="" disabled>Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Payment Condition" id="payment_condition" name="payment_condition" value={invoice.payment_condition || 'net_30'} onChange={handleInvoiceChange}>
                    <option value="net_15">Net 15 days</option>
                    <option value="net_30">Net 30 days</option>
                    <option value="net_60">Net 60 days</option>
                    <option value="due_on_receipt">Due on receipt</option>
                </Select>
                 <Select label="Currency" id="currency" name="currency" value={invoice.currency || 'USD'} onChange={handleInvoiceChange}>
                    <option value="USD">United States Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                </Select>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Input label="Issue Date*" type="date" id="issue_date" name="issue_date" value={invoice.issue_date || ''} onChange={handleInvoiceChange} required/>
                <Input label="Due Date*" type="date" id="due_date" name="due_date" value={invoice.due_date || ''} onChange={handleInvoiceChange} required/>
                <Input label="Delivery Date" type="date" id="delivery_date" name="delivery_date" value={invoice.delivery_date || ''} onChange={handleInvoiceChange} />
                <Input label="Reference of the invoice" id="reference" name="reference" placeholder="Invoice number" value={invoice.reference || ''} onChange={handleInvoiceChange} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Object" id="object" name="object" placeholder="Payment terms" value={invoice.object || ''} onChange={handleInvoiceChange} />
                <Textarea label="Additional info" id="additional_info" name="additional_info" placeholder="Receipt info (optional)" value={invoice.additional_info || ''} onChange={handleInvoiceChange} rows={1} />
            </div>

            <div className="flex items-center">
                 <input id="vat_applicable" name="vat_applicable" type="checkbox" checked={invoice.vat_applicable || false} onChange={handleInvoiceChange} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                 <label htmlFor="vat_applicable" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">VAT Applicable</label>
            </div>

            {/* Items Table */}
            <div>
                 <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-2/5">Product Name</th>
                                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Quantity</th>
                                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Discount</th>
                                <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Total Price</th>
                                <th className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {items.map((item, index) => {
                                const total = item.unit_price * item.quantity * (1 - item.discount / 100);
                                return (
                                <tr key={item.id || index}>
                                    <td className="p-2">
                                        <input type="text" placeholder="Product name" value={item.product_name} onChange={e => handleItemChange(index, 'product_name', e.target.value)} className="w-full bg-transparent p-1 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500" />
                                    </td>
                                    <td className="p-2"><input type="number" placeholder="Price" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} className="w-24 bg-transparent p-1 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500" /></td>
                                    <td className="p-2"><input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 bg-transparent p-1 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500" /></td>
                                    <td className="p-2"><input type="number" placeholder="%" value={item.discount} onChange={e => handleItemChange(index, 'discount', e.target.value)} className="w-20 bg-transparent p-1 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500" /></td>
                                    <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">${total.toFixed(2)}</td>
                                    <td className="p-3 text-center">
                                        <Button variant="icon" type="button" onClick={() => handleRemoveItem(index)}><DeleteIcon /></Button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
                 <Button type="button" variant="secondary" onClick={handleAddItem} className="mt-4"><PlusIcon /> Add new product</Button>
            </div>
            
            {/* Order Summary */}
            <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                    <h3 className="text-xl font-semibold">Order summary</h3>
                    <div className="space-y-1 text-gray-600 dark:text-gray-300">
                        <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Shipping estimate</span><span>${shipping.toFixed(2)}</span></div>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white border-t pt-2 mt-2 dark:border-gray-600">
                        <span>Order total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    </form>
  )
}

export default InvoiceCreate;
