export interface BaseEntity {
  id: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
}

export interface Customer extends BaseEntity {
  name: string;
  phone?: string;
  address?: string;
  location?: string;
  country?: string;
  metadata?: string; // JSON string
}

export interface VehicleType extends BaseEntity {
  name: string;
  description: string;
}

export interface Vehicle extends BaseEntity {
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  vehicle_type_id: number;
}

export interface Driver extends BaseEntity {
  name: string;
  license_number: string;
  phone: string;
  email: string;
}

export interface RouteCharge extends BaseEntity {
  name: string;
  start_location: string;
  end_location: string;
  distance: number; // in km
}

export interface Invoice extends BaseEntity {
  invoice_number: string;
  customer_id: number;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
}

export interface InvoiceItem extends BaseEntity {
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CreditNote extends BaseEntity {
  credit_note_number: string;
  invoice_id: number;
  customer_id: number;
  issue_date: string;
  total_amount: number;
  reason: string;
}

export interface CreditNoteItem extends BaseEntity {
  credit_note_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Document extends BaseEntity {
  name: string;
  type: 'Driving License' | 'Vehicle Registration' | 'Insurance';
  issue_date: string;
  expiry_date: string;
  file_url: string;
  owner_id: number; // Can be Driver ID or Vehicle ID
}

export interface Expense extends BaseEntity {
  vehicle_id: number;
  date: string;
  category: 'Fuel' | 'Maintenance' | 'Insurance' | 'Other';
  amount: number;
  description: string;
}

export interface Payment extends BaseEntity {
    invoice_id: number;
    payment_date: string;
    amount: number;
    payment_method: string;
}

export interface Journal extends BaseEntity {
    date: string;
    account: string;
    debit: number;
    credit: number;
    description: string;
}