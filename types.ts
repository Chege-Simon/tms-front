

export interface BaseEntity {
  id: number | string;
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
  name:string;
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
  code?: string;
  customer_id: string;
  issue_date: string;
  total_amount: number;
  currency: 'KES';
  status: 'Draft' | 'Issued' | 'Applied';
  customer?: Customer;
}

export interface CreditNoteItem extends BaseEntity {
  credit_note_id: string;
  description: string;
  credit_note_amount: number;
  credit_note?: CreditNote;
}

// A generic type for polymorphic relations in Document
export type Ownable = (Driver | Vehicle | Expense | Payment | object) & {
    id: string | number;
    code?: string;
    // Driver properties
    name?: string; 
    // Vehicle properties
    registration_number?: string; 
};

export interface Document extends BaseEntity {
  code?: string;
  file_type: 'LOG_BOOK' | 'LICENSE' | 'IDENTIFICATION' | 'RECEIPT' | 'CHEQUE' | 'INSURANCE';
  file_path: string;
  upload_date: string;
  owner?: Ownable;
}

export interface Expense extends BaseEntity {
  code?: string;
  vehicle_id: string;
  invoice_item_id?: string | null;
  type: 'DRIVER_WAGE' | 'LOADING_COST' | 'FUEL_COST' | 'MAINTENANCE_COST' | 'VEHICHLE_SERVICE_COST' | 'INSURANCE';
  expense_date: string;
  currency: 'KES';
  amount: number;
  vehicle?: Vehicle;
  invoice_item?: InvoiceItem;
}

export interface Payment extends BaseEntity {
    code?: string;
    customer_id: string; // UUID
    payment_date: string;
    currency: 'KES';
    total_amount: number;
    notes?: string;
    customer?: Customer;
}

export enum JournalTypeEnum {
    CREDIT = 'CREDIT',
    DEBIT = 'LICENSE', // Per backend enum where DEBIT value is 'LICENSE'
}

// A generic type for polymorphic relations in Journal
export type Journalable = (Expense | Payment | object) & {
    code?: string;
    type?: string; // For expenses
};
  
export interface Journal extends BaseEntity {
    code?: string;
    journal_type: JournalTypeEnum;
    currency: 'KES';
    amount: number;
    customer_id: string;
    customer?: Customer;
    journal_target?: Journalable; // The polymorphic relation object, matches API response
}