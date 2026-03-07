export interface ProductTier {
  name: string;
  price: number;
  includedSpecs?: OptionFormInput[];
}

export interface OptionFormInput {
  count: number;
  label: string;
  type?: 'text' | 'color' | 'select';
}

export interface InputRequest {
  id: string;
  sourceName: string;
  specs: OptionFormInput;
}

export interface Option {
  id: string;
  name: string;
  linkTier: number; // 0, 1, 2 for linked tiers, -1 for manual
  manualPrice?: number; // Used if linkTier is -1
  formInputs?: OptionFormInput;
}

export type CategoryType = 'radio' | 'checkbox';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  options: Option[];
}

export interface Product {
  id: string;
  name: string;
  tiers: ProductTier[]; // Array of base tiers
  messageTemplate: string;
  categories: Category[];
}

export type ExecutionStatus = 'pending' | 'in_progress' | 'ready' | 'delivered';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid_full';

export interface SelectedDetail {
  sourceName: string; // Was optionName
  label: string;
  values: string[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;       // Unit price
  quantity: number;    // Always >= 1
  details: string; // The generated string description
  selectedDetails?: SelectedDetail[];
  // Internal use for UI flow to render inputs
  _inputRequests?: InputRequest[];
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  source?: string;
}

export interface Delivery {
  type: 'pickup' | 'delivery';
  address?: string; // Required if type is delivery
  time?: string;
}

export interface Order {
  id: string; // auto-generated
  createdAt: string; // ISO String

  // Status flags
  executionStatus: ExecutionStatus;
  paymentStatus: PaymentStatus;
  isInvoiceIssued: boolean;

  eventDate: string; // ISO String (Date part)
  customer: Customer;
  delivery: Delivery;
  items: OrderItem[];
  internalNotes?: string;
  totalPrice: number;
}

export interface AppData {
  products: Product[];
}

export type ViewState = 'HOME' | 'CALCULATOR' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'PRODUCT_EDITOR' | 'ORDER_FORM' | 'ORDERS_DASHBOARD' | 'ORDER_DETAILS' | 'ORDER_EDIT';