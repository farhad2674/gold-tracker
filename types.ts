
export enum MetalType {
  Gold = 'طلا',
  Silver = 'نقره',
}

export enum ItemStatus {
  InStock = 'موجود',
  Sold = 'فروخته شده',
  BuybackPending = 'در انتظار بازخرید',
  Reserved = 'رزرو شده',
}

export enum TransactionType {
  Purchase = 'خرید', // We buy stock from supplier
  Sale = 'فروش',     // We sell to customer
  Buyback = 'بازخرید', // We buy back from customer
}

export interface Product {
  id: string;
  name: string;
  metalType: MetalType;
  weightGrams: number;
  purity: number; // e.g., 999.9
  manufacturer: string;
  packaging: string;
  sku?: string;
}

export interface Item {
  serialNumber: string;
  productId: string;
  status: ItemStatus;
  location: string;
  purchaseDate: string;
  costPrice: number;
  notes?: string;
  purchaseLink?: string;
  saleLink?: string;
  buybackLink?: string;
}

export interface Customer {
  id: string;
  name: string; // Name or Company Name
  type: 'حقیقی' | 'حقوقی';
  phone: string;
  email?: string;
  // New Fields
  nationalId?: string; // Code Melli (Individual) or Shenase Melli (Corporate)
  economicCode?: string; // Code Eghtesadi (Corporate)
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  documents?: boolean; // Mock flag if docs are uploaded
}

export interface TransactionLine {
  productId: string;
  itemSerialNumber?: string; // Optional for bulk purchase, required for Sale/Buyback
  quantity: number;
  unitPrice: number; // Price per item
  subtotal: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  customerId?: string; // For Sales/Buybacks
  supplierName?: string; // For Purchases
  lines: TransactionLine[];
  spotPriceGold: number;
  spotPriceSilver: number;
  totalAmount: number;
  fees: number; // VAT, Packaging deduction, etc.
  status: 'Draft' | 'Completed' | 'Cancelled';
}

export interface PriceSnapshot {
  id: string;
  transactionId: string;
  date: string;
  goldPrice: number;
  silverPrice: number;
  source: 'Manual' | 'API';
}

export interface SystemNotification {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  date: string;
  read: boolean;
}

export interface DashboardStats {
  totalInventoryValue: number;
  goldWeightInStock: number;
  silverWeightInStock: number;
  todaySales: number;
  pendingBuybacks: number;
}

// --- Invoice Interfaces ---
export interface InvoiceItem {
  row: number;
  desc: string;
  weight: number;
  purity: number;
  price: number;
  total: number;
  serial?: string;
}

export interface InvoiceData {
  id: string;
  date: string;
  customer: Customer;
  items: InvoiceItem[];
  totalAmount: number;
}
