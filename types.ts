export interface ProductTier {
  name: string;
  price: number;
}

export interface Option {
  id: string;
  name: string;
  linkTier: number; // 0, 1, 2 for linked tiers, -1 for manual
  manualPrice?: number; // Used if linkTier is -1
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

export interface AppData {
  products: Product[];
}

export type ViewState = 'HOME' | 'CALCULATOR' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'PRODUCT_EDITOR';