// ─── Dictionaries & Form Fields ───────────────────────────────────────────────

export interface GlobalDictionary {
  id: string;
  name: string;         // e.g. "Base Flavors"
  choices: string[];    // ["Chocolate", "Vanilla", "Pistachio"]
}

export interface FormField {
  id: string;
  label: string;                    // e.g. "Piping Color"
  type: 'text' | 'dictionary';
  dictionaryId?: string;            // Points to GlobalDictionary when type === 'dictionary'
  count: number;                    // How many times this input is requested
  isRequired: boolean;
}

// ─── Tier System ──────────────────────────────────────────────────────────────

export interface ProductTier {
  name: string;
  price: number;
  inheritedFields: FormField[];        // Fields INTRODUCED at this specific tier
  overrides?: Record<string, number>;  // fieldId → new count (overrides inherited count)
}

// ─── Options & Categories ─────────────────────────────────────────────────────

export interface Option {
  id: string;
  name: string;
  linkTier: number;              // 0, 1, 2 for linked tiers, -1 for manual
  manualPrice?: number;          // Used if linkTier is -1
  triggeredFields?: FormField[]; // Fields that appear only when this option is selected
  linkedProductId?: string;      // If set, selecting this option triggers a linked product modal
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
  targetProductIds: string[];  // IDs of products this category applies to
  options: Option[];           // Options always have linkTier: -1 (manualPrice only)
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description?: string;          // Optional product description
  tiers: ProductTier[];
  messageTemplate: string;
  categories: Category[];
  baseFields?: FormField[];      // Fields that ALWAYS appear for this product (any tier)
}

// ─── Input Request (internal UI bridge: Calculator → Order Form) ──────────────

export interface InputRequest {
  id: string;
  sourceName: string;        // e.g. "Base", "Classic (Tier 1)", "Option: Delivery"
  field: FormField;
  effectiveCount?: number;   // After applying tier overrides (may differ from field.count)
}

// ─── Order-related types ──────────────────────────────────────────────────────

export type ExecutionStatus = 'pending' | 'in_progress' | 'ready' | 'delivered';
export type PaymentStatus = 'unpaid' | 'deposit' | 'paid_full';

export interface SelectedDetail {
  sourceName: string;
  label: string;
  values: string[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  details: string;
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
  address?: string;
  time?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  executionStatus: ExecutionStatus;
  paymentStatus: PaymentStatus;
  isInvoiceIssued: boolean;
  eventDate: string;
  customer: Customer;
  delivery: Delivery;
  items: OrderItem[];
  internalNotes?: string;
  totalPrice: number;
}

// ─── App Data ─────────────────────────────────────────────────────────────────

export interface AppData {
  products: Product[];
  globalCategories: GlobalCategory[];
  globalDictionaries: GlobalDictionary[];
}

// ─── View Routing ─────────────────────────────────────────────────────────────

export type ViewState =
  | 'HOME'
  | 'CALCULATOR'
  | 'ADMIN_LOGIN'
  | 'ADMIN_DASHBOARD'
  | 'PRODUCT_EDITOR'
  | 'ORDER_FORM'
  | 'ORDERS_DASHBOARD'
  | 'ORDER_DETAILS'
  | 'ORDER_EDIT'
  | 'GLOBAL_CATEGORY_EDITOR'
  | 'DICTIONARY_MANAGER';
