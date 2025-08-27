

export interface BaseEntity {
  id: number | string;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User extends BaseEntity {
  name: string;
  email: string;
  status?: 'Active' | 'Inactive' | 'Blocked' | 'Pending';
}

export interface Customer extends BaseEntity {
  code?: string;
  name: string;
  phone?: string;
  address?: string;
  location?: string;
  country?: string;
  metadata?: string; // JSON string
}

export interface VehicleType extends BaseEntity {
  code?: string;
  name: string;
  size?: string;
  metadata?: string; // JSON string
}

export interface Vehicle extends BaseEntity {
  code?: string;
  brand: string;
  model?: string;
  chassis_number: string;
  registration_number: string;
  vehicle_type_id: number | string;
  metadata?: string; // JSON string
  vehicle_type?: VehicleType;
}

export interface Driver extends BaseEntity {
  code?: string;
  name: string;
  national_id: string;
  phone: string;
  vehicle: Vehicle;
  metadata?: string; // JSON string
}

export interface RouteCharge extends BaseEntity {
  code?: string;
  route: string;
  trip_charge: string;
  driver_wage: string;
  loading_charge: string;
  vehicle_type_id: number | string;
  vehicle_type?: VehicleType;
  metadata?: string; // JSON string
}

export interface InvoiceItem extends BaseEntity {
  code?: string;
  invoice_id: string;
  driver_id: string;
  route_charge_id: string;
  delivery_date: string;
  destination: string;
  actual_trip_charge: number;
  actual_driver_charge: number;
  actual_loading_charge: number;

  // relations
  invoice?: Invoice;
  driver?: Driver;
  route_charge?: RouteCharge;
}

export interface Invoice extends BaseEntity {
  code?: string;
  invoice_number?: string;
  customer_id: string;
  vehicle_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';
  currency: string;
  
  customer?: Customer;
  vehicle?: Vehicle;
  
  payment_condition?: string;
  delivery_date?: string;
  reference?: string;
  object?: string;
  additional_info?: string;
  vat_applicable?: boolean;
  
  subtotal?: number;
  tax?: number;
  shipping_estimate?: number;
  
  invoice_items?: InvoiceItem[];
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
  type: 'LOG_BOOK' | 'LICENSE' | 'IDENTIFICATION' | 'RECEIPT' | 'CHEQUE' | 'INSURANCE';
  issue_date: string;
  expiry_date: string;
  file_url: string;
  owner_id: number; // Can be Driver ID or Vehicle ID
}

export interface Expense extends BaseEntity {
  vehicle_id: number;
  date: string;
  category: 'DRIVER_WAGE' | 'LOADING_COST' | 'FUEL_COST' | 'MAINTENANCE_COST' | 'VEHICHLE_SERVICE_COST' | 'INSURANCE';
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