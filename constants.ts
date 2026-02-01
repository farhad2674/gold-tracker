
import { Item, ItemStatus, MetalType, Product, Customer, Transaction, TransactionType } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'شمش طلا پارسیس ۱ گرم', metalType: MetalType.Gold, weightGrams: 1, purity: 995, manufacturer: 'پارسیس', packaging: 'کارت وکیوم', sku: 'PG-001' },
  { id: 'p2', name: 'شمش طلا پارسیس ۱۰ گرم', metalType: MetalType.Gold, weightGrams: 10, purity: 995, manufacturer: 'پارسیس', packaging: 'کارت وکیوم', sku: 'PG-010' },
  { id: 'p3', name: 'شمش نقره سوئیسی ۱ انس', metalType: MetalType.Silver, weightGrams: 31.1, purity: 999, manufacturer: 'PAMP', packaging: 'باز', sku: 'SS-1OZ' },
  { id: 'p4', name: 'شمش طلا پارسیس ۲.۵ گرم', metalType: MetalType.Gold, weightGrams: 2.5, purity: 995, manufacturer: 'پارسیس', packaging: 'کارت وکیوم', sku: 'PG-0025' },
  { id: 'p5', name: 'شمش طلا پارسیس ۵ گرم', metalType: MetalType.Gold, weightGrams: 5, purity: 995, manufacturer: 'پارسیس', packaging: 'کارت وکیوم', sku: 'PG-005' },
  { id: 'p6', name: 'شمش طلا سوئیسی ۵۰ گرم', metalType: MetalType.Gold, weightGrams: 50, purity: 999.9, manufacturer: 'Valcambi', packaging: 'کارت وکیوم', sku: 'VG-050' },
  { id: 'p7', name: 'شمش طلا سوئیسی ۱۰۰ گرم', metalType: MetalType.Gold, weightGrams: 100, purity: 999.9, manufacturer: 'PAMP', packaging: 'کارت وکیوم', sku: 'PG-100' },
  { id: 'p8', name: 'شمش نقره ۱۰۰ گرم', metalType: MetalType.Silver, weightGrams: 100, purity: 999, manufacturer: 'Golran', packaging: 'وکیوم', sku: 'SG-100' },
  { id: 'p9', name: 'سکه تمام بهار آزادی', metalType: MetalType.Gold, weightGrams: 8.133, purity: 900, manufacturer: 'بانک مرکزی', packaging: 'پرس', sku: 'C-FULL' },
  { id: 'p10', name: 'سکه نیم بهار آزادی', metalType: MetalType.Gold, weightGrams: 4.066, purity: 900, manufacturer: 'بانک مرکزی', packaging: 'پرس', sku: 'C-HALF' },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'علی رضایی', type: 'حقیقی', phone: '09123456789', nationalId: '0012345678', city: 'تهران' },
  { id: 'c2', name: 'سارا محمدی', type: 'حقیقی', phone: '09198765432', nationalId: '0023456789', city: 'اصفهان' },
  { id: 'c3', name: 'شرکت سرمایه گذاری زرین', type: 'حقوقی', phone: '02188888888', nationalId: '10101234567', economicCode: '411122223333', city: 'تهران' },
  { id: 'c4', name: 'جواهری نور', type: 'حقوقی', phone: '02177777777', city: 'مشهد' },
  { id: 'c5', name: 'محمد امینی', type: 'حقیقی', phone: '09350000001' },
  { id: 'c6', name: 'زهرا کاظمی', type: 'حقیقی', phone: '09120000002' },
  { id: 'c7', name: 'بازرگانی امید', type: 'حقوقی', phone: '02166666666' },
  { id: 'c8', name: 'رضا کریمی', type: 'حقیقی', phone: '09180000003' },
];

// Helper to generate a large list of items
const generateItems = () => {
  const items: Item[] = [];
  
  const add = (pid: string, count: number, startSerial: number, price: number, status: ItemStatus, loc: string, saleId?: string) => {
    for(let i=0; i<count; i++) {
      items.push({
        serialNumber: `SN-${pid.toUpperCase().replace('P', '')}-${startSerial + i}`,
        productId: pid,
        status: status,
        location: loc,
        purchaseDate: '2023-10-01',
        costPrice: price,
        saleLink: saleId
      });
    }
  };

  // In Stock Inventory
  add('p1', 8, 1000, 35000000, ItemStatus.InStock, 'گاوصندوق ۱');
  add('p2', 5, 2000, 350000000, ItemStatus.InStock, 'ویترین');
  add('p3', 12, 3000, 15000000, ItemStatus.InStock, 'کشو نقره');
  add('p4', 6, 4000, 88000000, ItemStatus.InStock, 'گاوصندوق ۱');
  add('p5', 4, 5000, 175000000, ItemStatus.InStock, 'گاوصندوق ۱');
  add('p9', 15, 9000, 320000000, ItemStatus.InStock, 'ویترین سکه');
  add('p10', 10, 10000, 160000000, ItemStatus.InStock, 'ویترین سکه');
  add('p7', 2, 7000, 3500000000, ItemStatus.InStock, 'خزانه مرکزی');

  // Sold Items (Linked to Transactions below)
  // TX-001 (2x p1)
  add('p1', 2, 1100, 34000000, ItemStatus.Sold, 'Customer', 'TX-001');
  // TX-002 (1x p2)
  add('p2', 1, 2100, 335000000, ItemStatus.Sold, 'Customer', 'TX-002');
  // TX-003 (3x p9)
  add('p9', 3, 9100, 310000000, ItemStatus.Sold, 'Customer', 'TX-003');
  // TX-004 (2x p4)
  add('p4', 2, 4100, 85000000, ItemStatus.Sold, 'Customer', 'TX-004');

  return items;
};

export const MOCK_ITEMS = generateItems();

// Mock Transactions History
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    type: TransactionType.Sale,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    customerId: 'c1',
    spotPriceGold: 36000000,
    spotPriceSilver: 480000,
    totalAmount: 76000000, // 2 * 1g
    fees: 0,
    status: 'Completed',
    lines: [
      { productId: 'p1', itemSerialNumber: 'SN-1-1100, SN-1-1101', quantity: 2, unitPrice: 38000000, subtotal: 76000000 }
    ]
  },
  {
    id: 'TX-002',
    type: TransactionType.Sale,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    customerId: 'c3',
    spotPriceGold: 35800000,
    spotPriceSilver: 475000,
    totalAmount: 375000000, // 10g
    fees: 0,
    status: 'Completed',
    lines: [
      { productId: 'p2', itemSerialNumber: 'SN-2-2100', quantity: 1, unitPrice: 375000000, subtotal: 375000000 }
    ]
  },
  {
    id: 'TX-003',
    type: TransactionType.Sale,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    customerId: 'c2',
    spotPriceGold: 36200000,
    spotPriceSilver: 490000,
    totalAmount: 990000000, // 3x Full Coin
    fees: 0,
    status: 'Completed',
    lines: [
      { productId: 'p9', itemSerialNumber: 'SN-9-9100, SN-9-9101, SN-9-9102', quantity: 3, unitPrice: 330000000, subtotal: 990000000 }
    ]
  },
  {
    id: 'TX-004',
    type: TransactionType.Sale,
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    customerId: 'c4',
    spotPriceGold: 36500000,
    spotPriceSilver: 500000,
    totalAmount: 190000000, // 2x 2.5g
    fees: 0,
    status: 'Completed',
    lines: [
      { productId: 'p4', itemSerialNumber: 'SN-4-4100, SN-4-4101', quantity: 2, unitPrice: 95000000, subtotal: 190000000 }
    ]
  }
];

// Initial mock spot prices (Rials per gram)
export const INITIAL_GOLD_PRICE = 36500000; 
export const INITIAL_SILVER_PRICE = 495000;
