export interface ProductTier {
  name: string;
  price: number;
  includedSpecs?: OptionFormInput[]; // Fields shown cumulatively: tier N inherits specs from all tiers 0..N
}

export interface OptionFormInput {
  count: number;
  label: string;
  type?: 'text' | 'color' | 'select';
  choices?: string[]; // Predefined dropdown choices; when set renders a <select> in the order form
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
  formInputs?: OptionFormInput[]; // Multiple detail groups per option (e.g. Fillings + Colors)
  linkedProductId?: string; // If set, selecting this option triggers a linked product modal
}

export type CategoryType = 'radio' | 'checkbox';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  options: Option[];
}

export interface GlobalCategory {
  id: string;
  name: string;
  type: CategoryType;
  targetProductIds: string[]; // IDs of products this category applies to
  options: Option[];          // Options always have linkTier: -1 (manualPrice only)
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
  // Internal flag: true for items added via linked-product modal (quantity locked at 1)
  _isLinked?: boolean;
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
  globalCategories: GlobalCategory[];
}

export type ViewState = 'HOME' | 'CALCULATOR' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'PRODUCT_EDITOR' | 'ORDER_FORM' | 'ORDERS_DASHBOARD' | 'ORDER_DETAILS' | 'ORDER_EDIT' | 'GLOBAL_CATEGORY_EDITOR';