
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Package, ShoppingBag, RefreshCw, 
  Menu, Bell, FileText, X
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import InventoryManager from './components/InventoryManager';
import PointOfSale from './components/PointOfSale';
import BuybackManager from './components/BuybackManager';
import SalesHistory from './components/SalesHistory';

// Data & Types
import { 
  Item, Product, Customer, Transaction, ItemStatus, TransactionType, 
  MetalType, PriceSnapshot, SystemNotification 
} from './types';
import { 
  MOCK_ITEMS, MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_TRANSACTIONS,
  INITIAL_GOLD_PRICE, INITIAL_SILVER_PRICE 
} from './constants';

type View = 'dashboard' | 'inventory' | 'pos' | 'buyback' | 'history';

const App: React.FC = () => {
  // --- Global Application State (Simulating Database) ---
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // Data State
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS); // Converted to state
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS); 
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [priceSnapshots, setPriceSnapshots] = useState<PriceSnapshot[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  
  const [spotGold, setSpotGold] = useState(INITIAL_GOLD_PRICE);
  const [spotSilver, setSpotSilver] = useState(INITIAL_SILVER_PRICE);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- Automation Helpers ---

  // 1. Auto-generate readable IDs (e.g., INV-1001, PUR-1002)
  const generateId = (prefix: string) => {
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const timestamp = Date.now().toString().slice(-4); 
    return `${prefix}-${timestamp}${random}`;
  };

  // 2. Capture Price Snapshot
  const createPriceSnapshot = (transactionId: string) => {
    const snapshot: PriceSnapshot = {
      id: `SNP-${Date.now()}`,
      transactionId,
      date: new Date().toISOString(),
      goldPrice: spotGold,
      silverPrice: spotSilver,
      source: 'Manual'
    };
    setPriceSnapshots(prev => [...prev, snapshot]);
  };

  // 3. Low Stock Check
  const checkLowStock = (currentItems: Item[]) => {
    const LOW_STOCK_THRESHOLD = 2;
    products.forEach(product => {
      const stockCount = currentItems.filter(i => i.productId === product.id && i.status === ItemStatus.InStock).length;
      if (stockCount <= LOW_STOCK_THRESHOLD) {
        addNotification(
          'warning', 
          `هشدار موجودی: موجودی ${product.name} به ${stockCount} عدد رسید.`
        );
      }
    });
  };

  const addNotification = (type: 'warning' | 'info' | 'success', message: string) => {
    const newNotif: SystemNotification = {
      id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      message,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // --- Handlers ---

  // Helper to handle Persian Price Input
  const handlePriceChange = (value: string, setter: (val: number) => void) => {
    // 1. Remove commas (English and Persian)
    const noCommas = value.replace(/,|٬/g, '');
    
    // 2. Convert Persian digits to English
    const englishDigits = noCommas.replace(/[۰-۹]/g, (d) =>
      '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()
    );
    
    // 3. Remove any non-digits
    const cleanNumber = englishDigits.replace(/\D/g, '');

    if (cleanNumber === '') {
       setter(0);
       return;
    }

    // 4. Parse
    const number = parseFloat(cleanNumber);
    if (!isNaN(number)) {
      setter(number);
    }
  };

  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      id: `P-${Date.now()}`,
      ...newProductData
    };
    setProducts(prev => [...prev, newProduct]);
    addNotification('success', `محصول جدید "${newProduct.name}" به کاتالوگ اضافه شد.`);
  };

  const handleAddStock = (product: Product, serials: string[], costPerItem: number, supplier: string) => {
    // 1. Validation: Prevent Duplicate Serials
    const duplicates = serials.filter(s => items.some(existing => existing.serialNumber === s));
    if (duplicates.length > 0) {
      alert(`خطا: سریال‌های زیر تکراری هستند و ثبت نشدند:\n${duplicates.join(', ')}`);
      return;
    }

    const transactionId = generateId('PUR');

    const newItems: Item[] = serials.map(sn => ({
      serialNumber: sn,
      productId: product.id,
      status: ItemStatus.InStock,
      location: 'Store Safe',
      purchaseDate: new Date().toISOString(),
      costPrice: costPerItem,
      purchaseLink: transactionId // Linking to transaction
    }));

    const transaction: Transaction = {
      id: transactionId,
      type: TransactionType.Purchase,
      date: new Date().toISOString(),
      supplierName: supplier,
      spotPriceGold: spotGold,
      spotPriceSilver: spotSilver,
      totalAmount: serials.length * costPerItem,
      fees: 0,
      status: 'Completed',
      lines: [{
        productId: product.id,
        quantity: serials.length,
        unitPrice: costPerItem,
        subtotal: serials.length * costPerItem,
        itemSerialNumber: serials.join(', ')
      }]
    };

    // Updates
    setItems([...items, ...newItems]);
    setTransactions(prev => [transaction, ...prev]);
    createPriceSnapshot(transactionId);
    addNotification('success', `${serials.length} عدد ${product.name} با موفقیت به موجودی اضافه شد.`);
  };

  const handleSale = (serialNumbers: string[], customerId: string, total: number, customTransactionId?: string) => {
    const transactionId = customTransactionId || generateId('INV');

    // 1. Update Items Status -> Sold
    const updatedItems = items.map(item => {
      if (serialNumbers.includes(item.serialNumber)) {
        return { 
          ...item, 
          status: ItemStatus.Sold, 
          location: 'Customer',
          saleLink: transactionId 
        };
      }
      return item;
    });
    setItems(updatedItems);

    // 2. Create Transaction
    // Ensure we capture item details correctly from current items state before update (closure captures current items)
    const transaction: Transaction = {
      id: transactionId,
      type: TransactionType.Sale,
      date: new Date().toISOString(),
      customerId: customerId,
      spotPriceGold: spotGold,
      spotPriceSilver: spotSilver,
      totalAmount: total,
      fees: 0,
      status: 'Completed', // In a real app, this might start as 'Draft'
      lines: serialNumbers.map(sn => {
         const item = items.find(i => i.serialNumber === sn);
         return {
           productId: item?.productId || '',
           itemSerialNumber: sn,
           quantity: 1,
           unitPrice: total / serialNumbers.length,
           subtotal: total / serialNumbers.length
         }
      })
    };
    
    setTransactions(prev => [transaction, ...prev]);
    createPriceSnapshot(transactionId);
    
    // 3. Automation: Check Low Stock
    checkLowStock(updatedItems);
    
    // Note: We removed the alert here to let PointOfSale handle the success UI (Invoice Modal)
    if (!customTransactionId) {
       alert(`فاکتور فروش ${transactionId} با موفقیت ثبت شد!`);
       setActiveView('dashboard');
    }
  };

  const handleBuyback = (product: Product, serial: string, price: number, customerId: string) => {
     const transactionId = generateId('BB');
     
     // 1. Check if item exists to update, else create new (Manual Intake)
     const exists = items.find(i => i.serialNumber === serial);
     let newItems = [...items];

     if (exists) {
       // Item returning to stock
       newItems = items.map(i => i.serialNumber === serial ? { 
         ...i, 
         status: ItemStatus.InStock, 
         location: 'Quarantine', 
         costPrice: price, // Re-valued at buyback price
         buybackLink: transactionId
       } : i);
     } else {
       // Manual Intake of unknown item
       newItems.push({
         serialNumber: serial,
         productId: product.id,
         status: ItemStatus.InStock,
         location: 'Quarantine',
         purchaseDate: new Date().toISOString(),
         costPrice: price,
         notes: 'Bought back from customer (Manual Intake)',
         buybackLink: transactionId
       });
     }
     setItems(newItems);

     const transaction: Transaction = {
       id: transactionId,
       type: TransactionType.Buyback,
       date: new Date().toISOString(),
       customerId: customerId,
       spotPriceGold: spotGold,
       spotPriceSilver: spotSilver,
       totalAmount: price,
       fees: 0, 
       status: 'Completed',
       lines: [{
         productId: product.id,
         itemSerialNumber: serial,
         quantity: 1,
         unitPrice: price,
         subtotal: price
       }]
     };

     setTransactions(prev => [transaction, ...prev]);
     createPriceSnapshot(transactionId);
     addNotification('info', `آیتم ${serial} بازخرید شد و به موجودی اضافه گردید.`);
     alert(`سند بازخرید ${transactionId} ثبت شد.`);
  };

  const handleAddCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newId = `c-${Date.now()}`;
    const newCustomer: Customer = {
      id: newId,
      ...customerData
    };
    setCustomers([...customers, newCustomer]);
    addNotification('success', `مشتری جدید (${newCustomer.name}) با موفقیت اضافه شد.`);
    return newId;
  };

  // --- Render ---

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex print:hidden">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-slate-900">B</span>
            </div>
            مدیریت طلا
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')} 
            icon={LayoutDashboard} 
            label="داشبورد" 
          />
          <NavItem 
            active={activeView === 'inventory'} 
            onClick={() => setActiveView('inventory')} 
            icon={Package} 
            label="موجودی انبار" 
          />
          <NavItem 
            active={activeView === 'pos'} 
            onClick={() => setActiveView('pos')} 
            icon={ShoppingBag} 
            label="فروش (POS)" 
          />
           <NavItem 
            active={activeView === 'history'} 
            onClick={() => setActiveView('history')} 
            icon={FileText} 
            label="تاریخچه فروش" 
          />
          <NavItem 
            active={activeView === 'buyback'} 
            onClick={() => setActiveView('buyback')} 
            icon={RefreshCw} 
            label="بازخرید" 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                 <span className="font-bold text-white">SM</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">مدیر فروشگاه</p>
                <p className="text-xs text-slate-500">شعبه مرکزی</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* NEW HEADER DESIGN */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-6 sticky top-0 z-40 print:hidden transition-all">
          
          {/* Left Section: Mobile Menu & Page Title */}
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
              <Menu size={24} />
            </button>
            
            {/* Page Title Context */}
            <div className="hidden md:flex flex-col">
               <h2 className="text-lg font-bold text-slate-800">
                 {activeView === 'dashboard' && 'داشبورد مدیریتی'}
                 {activeView === 'inventory' && 'مدیریت موجودی'}
                 {activeView === 'pos' && 'فروشگاه (POS)'}
                 {activeView === 'history' && 'تاریخچه تراکنش‌ها'}
                 {activeView === 'buyback' && 'بازخرید و مرجوعی'}
               </h2>
               <p className="text-xs text-slate-500">
                 {new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
               </p>
            </div>
          </div>
          
          {/* Center Section: Live Price Widgets */}
          <div className="hidden sm:flex items-center gap-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              
              {/* Gold Widget */}
              <div className="flex items-center bg-amber-50 border border-amber-100 rounded-2xl p-2 pr-5 pl-2 shadow-sm hover:shadow-md transition-all group focus-within:ring-2 focus-within:ring-amber-200 gap-4">
                 <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-0.5">نرخ طلا (ریال)</span>
                    <div className="flex items-baseline gap-1">
                       <input 
                          type="text"
                          className="w-40 bg-transparent p-0 text-xl font-bold text-amber-900 focus:outline-none placeholder-amber-300 text-left font-sans"
                          value={spotGold.toLocaleString('fa-IR')}
                          onChange={(e) => handlePriceChange(e.target.value, setSpotGold)}
                          dir="ltr"
                       />
                    </div>
                 </div>
                 <div className="w-12 h-12 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-400/30 group-hover:scale-105 transition-transform">
                    <span className="font-bold text-sm tracking-tight">XAU</span>
                 </div>
              </div>

              {/* Silver Widget */}
              <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-2 pr-5 pl-2 shadow-sm hover:shadow-md transition-all group focus-within:ring-2 focus-within:ring-slate-200 gap-4">
                 <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">نرخ نقره (ریال)</span>
                    <div className="flex items-baseline gap-1">
                       <input 
                          type="text"
                          className="w-40 bg-transparent p-0 text-xl font-bold text-slate-700 focus:outline-none placeholder-slate-300 text-left font-sans"
                          value={spotSilver.toLocaleString('fa-IR')}
                          onChange={(e) => handlePriceChange(e.target.value, setSpotSilver)}
                          dir="ltr"
                       />
                    </div>
                 </div>
                 <div className="w-12 h-12 rounded-xl bg-slate-400 text-white flex items-center justify-center shadow-lg shadow-slate-400/30 group-hover:scale-105 transition-transform">
                    <span className="font-bold text-sm tracking-tight">XAG</span>
                 </div>
              </div>

          </div>
          
          {/* Right Section: Notifications */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                className={`p-3 rounded-xl transition-all ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div className="absolute left-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up origin-top-left">
                   <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                     <h3 className="font-bold text-sm text-slate-800">مرکز پیام</h3>
                     <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                   </div>
                   <div className="max-h-72 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                          <Bell size={24} className="mb-2 opacity-20"/>
                          <p className="text-xs">پیام جدیدی نیست</p>
                       </div>
                     ) : (
                       notifications.map(notif => (
                         <div key={notif.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${notif.type === 'warning' ? 'bg-amber-50/30' : ''}`}>
                           <div className="flex gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'warning' ? 'bg-amber-500' : notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                              <div>
                                <p className="text-sm font-medium text-slate-700 leading-snug">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-mono opacity-70" dir="ltr">{new Date(notif.date).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                   <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                      <button className="text-[10px] text-indigo-600 font-bold hover:underline" onClick={() => setNotifications([])}>پاک کردن همه</button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
          {activeView === 'dashboard' && (
            <Dashboard 
              items={items} 
              transactions={transactions} 
              products={products}
              currentSpotGold={spotGold}
              currentSpotSilver={spotSilver}
            />
          )}
          
          {activeView === 'inventory' && (
            <InventoryManager 
              items={items} 
              products={products} 
              onAddStock={handleAddStock}
              onAddProduct={handleAddProduct}
            />
          )}

          {activeView === 'pos' && (
            <PointOfSale 
               items={items}
               products={products}
               customers={customers}
               currentSpotGold={spotGold}
               currentSpotSilver={spotSilver}
               onCompleteSale={handleSale}
               onAddCustomer={handleAddCustomer}
            />
          )}
          
          {activeView === 'history' && (
             <SalesHistory 
               transactions={transactions}
               customers={customers}
               products={products}
               items={items}
             />
          )}

          {activeView === 'buyback' && (
            <BuybackManager 
               items={items}
               products={products}
               customers={customers}
               currentSpotGold={spotGold}
               currentSpotSilver={spotSilver}
               onCompleteBuyback={handleBuyback}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// Helper Component for Sidebar Items
const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
  >
    <Icon size={20} className="ml-3" />
    <span className="font-medium">{label}</span>
  </button>
);

export default App;
