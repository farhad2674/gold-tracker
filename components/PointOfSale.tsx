
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Product, Customer, ItemStatus, MetalType, InvoiceData } from '../types';
import { 
  User, ScanLine, ShoppingCart, X, 
  Search, Plus, Box, ChevronDown, 
  UserPlus, Phone, FileText, Building2, MapPin, UploadCloud, FileCheck, Calculator
} from 'lucide-react';
import InvoiceModal from './InvoiceModal';

interface PointOfSaleProps {
  items: Item[];
  products: Product[];
  customers: Customer[];
  currentSpotGold: number;
  currentSpotSilver: number;
  onCompleteSale: (items: string[], customerId: string, total: number, transactionId: string) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => string;
}

const PointOfSale: React.FC<PointOfSaleProps> = ({ 
  items, products, customers, currentSpotGold, currentSpotSilver, onCompleteSale, onAddCustomer
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [serialInput, setSerialInput] = useState('');
  const [cartSerials, setCartSerials] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GOLD' | 'SILVER'>('ALL');
  
  // Sales Configuration (Daily Ojorat)
  const [dailyOjorat, setDailyOjorat] = useState<number>(2100000); // Default 2,100,000 Rials
  const [profitMargin, setProfitMargin] = useState<number>(7); // Default 7% Profit

  // Custom Dropdown State
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerTypeTab, setCustomerTypeTab] = useState<'حقیقی' | 'حقوقی'>('حقیقی');
  
  // Comprehensive Customer Form State
  const initialCustomerState = {
    name: '',
    phone: '',
    type: 'حقیقی' as 'حقیقی' | 'حقوقی',
    nationalId: '',
    economicCode: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    email: ''
  };
  const [newCustomer, setNewCustomer] = useState(initialCustomerState);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Invoice State
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState<InvoiceData | null>(null);

  // --- Helpers ---

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculatePrice = (product: Product) => {
    const spotPrice = product.metalType === MetalType.Gold ? currentSpotGold : currentSpotSilver;
    
    // Formula: (Spot Price + Ojorat) * Weight
    const baseUnitCost = spotPrice + dailyOjorat;
    const totalCost = baseUnitCost * product.weightGrams;
    
    // Add Profit Margin
    const finalPrice = totalCost + (totalCost * (profitMargin / 100));
    
    return Math.floor(finalPrice);
  };

  // Persian Number Formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fa-IR').format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(value);
  };

  // --- Memoized Data ---

  // Filtered Customers for Dropdown
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
      c.phone.includes(customerSearchTerm)
    );
  }, [customers, customerSearchTerm]);

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // 1. Available Items with Filters
  const filteredAvailableItems = useMemo(() => {
    return items.filter(item => {
      // Basic status check
      if (item.status !== ItemStatus.InStock || cartSerials.includes(item.serialNumber)) return false;
      
      const product = products.find(p => p.id === item.productId);
      if (!product) return false;

      // Filter by Metal Type
      if (activeFilter === 'GOLD' && product.metalType !== MetalType.Gold) return false;
      if (activeFilter === 'SILVER' && product.metalType !== MetalType.Silver) return false;

      // Filter by Search
      if (serialInput) {
        const searchLower = serialInput.toLowerCase();
        return item.serialNumber.toLowerCase().includes(searchLower) || 
               product.name.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [items, products, cartSerials, serialInput, activeFilter]);

  // 2. Cart Calculations
  const cartCalculations = useMemo(() => {
    let total = 0;
    const lineItems = cartSerials.map(serial => {
      const item = items.find(i => i.serialNumber === serial)!;
      const product = products.find(p => p.id === item.productId)!;
      const sellPrice = calculatePrice(product);
      
      total += sellPrice;
      
      return {
        serial,
        productName: product.name,
        metalType: product.metalType,
        weight: product.weightGrams,
        purity: product.purity,
        price: sellPrice
      };
    });
    return { lineItems, total };
  }, [cartSerials, items, products, currentSpotGold, currentSpotSilver, dailyOjorat, profitMargin]);

  // --- Handlers ---

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if(newCustomer.name && newCustomer.phone) {
      const customerPayload: Omit<Customer, 'id'> = {
        ...newCustomer,
        type: customerTypeTab,
        documents: !!uploadedFileName
      };
      
      const newId = onAddCustomer(customerPayload);
      setSelectedCustomerId(newId);
      setShowAddCustomerModal(false);
      setIsCustomerDropdownOpen(false);
      
      // Reset Form
      setNewCustomer(initialCustomerState);
      setUploadedFileName(null);
      setCustomerTypeTab('حقیقی');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFileName(e.dataTransfer.files[0].name);
      e.dataTransfer.clearData();
    }
  };

  const addToCart = (serial: string) => {
    if (cartSerials.includes(serial)) return;
    const item = items.find(i => i.serialNumber === serial);
    
    if (item && item.status === ItemStatus.InStock) {
      setCartSerials([...cartSerials, serial]);
      setSerialInput(''); // Clear search on add
    } else {
      // Only alert if trying to add via manual input and it fails
      if (serial === serialInput) alert("آیتم موجود نیست یا قبلاً انتخاب شده است.");
    }
  };

  const removeFromCart = (serial: string) => {
    setCartSerials(cartSerials.filter(s => s !== serial));
  };

  const handleSale = () => {
    if (cartSerials.length === 0) return;
    
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) {
      alert("اطلاعات مشتری نامعتبر است. لطفاً یک مشتری را انتخاب کنید.");
      return;
    }
    
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `INV-${Date.now().toString().slice(-4)}${randomId}`;

    // Prepare Invoice Data immediately
    const invoiceData: InvoiceData = {
      id: transactionId,
      date: new Date().toLocaleDateString('fa-IR'),
      customer: customer,
      items: cartCalculations.lineItems.map((line, index) => ({
        row: index + 1,
        desc: `${line.productName}`,
        serial: line.serial,
        weight: line.weight,
        purity: line.purity,
        price: line.price,
        total: line.price
      })),
      totalAmount: cartCalculations.total
    };

    // 1. Set Invoice Data for Modal
    setLastInvoiceData(invoiceData);
    
    // 2. Execute Sale Logic in App (Updates History & Inventory)
    onCompleteSale(cartSerials, selectedCustomerId, cartCalculations.total, transactionId);
    
    // 3. Clear cart and open modal
    setCartSerials([]);
    setShowInvoice(true);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-7rem)] overflow-hidden">
      
      {/* --- LEFT COLUMN: Product Catalog & Selection --- */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        
        {/* NEW: Sales Configuration Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 animate-fade-in-down relative z-30">
           <div className="flex items-center gap-2 text-slate-700 font-bold text-sm border-l border-slate-200 pl-4 ml-2">
              <Calculator size={18} className="text-emerald-500"/>
              <span>تنظیمات نرخ و اجرت روز</span>
           </div>
           
           <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">اجرت ساخت (ریالی):</label>
              <input 
                 type="number" 
                 className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                 value={dailyOjorat}
                 onChange={(e) => setDailyOjorat(Number(e.target.value))}
                 dir="ltr"
              />
           </div>

           <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">سود فروشنده (درصد):</label>
              <input 
                 type="number" 
                 className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                 value={profitMargin}
                 onChange={(e) => setProfitMargin(Number(e.target.value))}
                 dir="ltr"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
           </div>
           
           <div className="mr-auto text-[10px] text-slate-400 hidden lg:block">
              قیمت نهایی = (قیمت تابلو + اجرت) × وزن + سود
           </div>
        </div>

        {/* 1. Header & Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative z-20">
          
          {/* Custom Customer Dropdown */}
          <div className="w-full md:w-80 relative" ref={dropdownRef}>
            <label className="text-xs text-slate-500 block mb-1">مشتری</label>
            <div 
              className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2.5 cursor-pointer bg-slate-50 hover:bg-white transition-colors"
              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">
                    {selectedCustomerObj?.name || 'انتخاب مشتری'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedCustomerObj ? selectedCustomerObj.phone : 'جستجو یا افزودن جدید'}
                  </span>
                </div>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Content */}
            {isCustomerDropdownOpen && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="جستجوی نام یا تلفن..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pr-8 pl-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between ${selectedCustomerId === c.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{c.name}</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-1.5 rounded">{c.type}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono" dir="ltr">{c.phone}</span>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="px-4 py-3 text-center text-xs text-slate-400">
                      موردی یافت نشد
                    </div>
                  )}
                </div>

                <div 
                  className="p-2 border-t border-slate-100 bg-slate-50 cursor-pointer hover:bg-emerald-50 text-emerald-700 flex items-center justify-center gap-2 transition-colors"
                  onClick={() => setShowAddCustomerModal(true)}
                >
                  <Plus size={16} />
                  <span className="text-sm font-bold">افزودن مشتری جدید</span>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96 group">
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
              placeholder="جستجو (شماره سریال یا نام محصول)..."
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              // Allow pressing enter to add exact match
              onKeyDown={(e) => {
                 if (e.key === 'Enter' && serialInput) {
                    const exactMatch = items.find(i => i.serialNumber === serialInput);
                    if (exactMatch) addToCart(exactMatch.serialNumber);
                 }
              }}
              dir="rtl"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
          </div>
        </div>

        {/* 2. Filter Tabs */}
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveFilter('ALL')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeFilter === 'ALL' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
           >
             همه محصولات
           </button>
           <button 
             onClick={() => setActiveFilter('GOLD')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeFilter === 'GOLD' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
           >
             <div className="w-2 h-2 rounded-full bg-yellow-200"></div>
             طلا
           </button>
           <button 
             onClick={() => setActiveFilter('SILVER')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeFilter === 'SILVER' ? 'bg-slate-500 text-white shadow-lg shadow-slate-500/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
           >
             <div className="w-2 h-2 rounded-full bg-slate-200"></div>
             نقره
           </button>
        </div>

        {/* 3. Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2">
           {filteredAvailableItems.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <Box size={48} className="mb-2 opacity-20" />
                <p>موردی یافت نشد</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredAvailableItems.map(item => {
                  const product = products.find(p => p.id === item.productId)!;
                  const price = calculatePrice(product);
                  const isGold = product.metalType === MetalType.Gold;

                  return (
                    <div 
                      key={item.serialNumber}
                      onClick={() => addToCart(item.serialNumber)}
                      className={`
                        relative group cursor-pointer rounded-2xl p-4 border transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1
                        ${isGold 
                          ? 'bg-gradient-to-br from-white to-amber-50 border-amber-100 hover:border-amber-300' 
                          : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isGold ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                           {product.metalType}
                        </span>
                        <span className="font-mono text-xs text-slate-400" dir="ltr">{item.serialNumber}</span>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 h-10">{product.name}</h3>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-100">{formatNumber(product.weightGrams)} گرم</span>
                        <span className="bg-white px-1.5 py-0.5 rounded border border-slate-100">{formatNumber(product.purity)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-emerald-600 font-bold flex items-center gap-1">
                           {formatCurrency(price)} <span className="text-[10px] text-emerald-500">ریال</span>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isGold ? 'bg-amber-100 group-hover:bg-amber-500 text-amber-600 group-hover:text-white' : 'bg-slate-100 group-hover:bg-slate-500 text-slate-600 group-hover:text-white'}`}>
                           <Plus size={16} />
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: Cart Widget --- */}
      <div className="w-full xl:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col h-full print:hidden relative overflow-hidden">
        
        {/* Cart Header - Widget Style */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-10 translate-x-10"></div>
           <div className="relative z-10 flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="text-emerald-400" size={20} />
             </div>
             <div>
                <h2 className="font-bold text-lg">سبد فروش</h2>
                <p className="text-[10px] text-slate-400">فاکتور نهایی</p>
             </div>
           </div>
           <span className="relative z-10 bg-emerald-500 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg shadow-emerald-900/20">
             {formatNumber(cartSerials.length)}
           </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
           {cartCalculations.lineItems.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
               <ScanLine size={48} className="mb-3 text-slate-300" />
               <p className="text-sm font-medium">آیتمی را اسکن یا انتخاب کنید</p>
             </div>
           ) : (
             cartCalculations.lineItems.map(line => (
               <div key={line.serial} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  {/* Metal Icon */}
                  <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${line.metalType === MetalType.Gold ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Box size={18} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{line.productName}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] font-mono bg-slate-100 px-1.5 rounded text-slate-500" dir="ltr">{line.serial}</span>
                       <span className="text-[10px] text-slate-400">{formatNumber(line.weight)} گرم</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                     <button 
                       onClick={() => removeFromCart(line.serial)}
                       className="text-slate-300 hover:text-red-500 transition-colors p-1"
                     >
                       <X size={14} />
                     </button>
                     <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(line.price)}
                     </p>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Cart Footer / Totals */}
        <div className="p-6 bg-white border-t border-slate-100 mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
           <div className="space-y-3 mb-6 text-sm text-slate-500">
              <div className="flex justify-between">
                 <span>جمع کل</span>
                 <span className="font-medium text-slate-800">{formatCurrency(cartCalculations.total)} ریال</span>
              </div>
              <div className="flex justify-between">
                 <span>مالیات / کارمزد</span>
                 <span className="font-medium text-slate-800">۰ ریال</span>
              </div>
              <div className="h-px bg-slate-100 my-2 border-t border-dashed border-slate-300"></div>
              <div className="flex justify-between items-end">
                 <span className="font-bold text-slate-800 text-base">مبلغ قابل پرداخت</span>
                 <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(cartCalculations.total)} <span className="text-xs text-slate-400 font-normal">ریال</span>
                 </span>
              </div>
           </div>

           <button 
             onClick={handleSale}
             disabled={cartSerials.length === 0}
             className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
           >
             <FileText size={20} className="text-emerald-400 group-hover:text-emerald-300 transition-colors" />
             ثبت و صدور فاکتور
           </button>
        </div>
      </div>

      {/* --- PROFESSIONAL ADD CUSTOMER MODAL (Fixed Scrolling & Layout) --- */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm overflow-y-auto">
           <div className="flex min-h-full items-center justify-center p-4">
             <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-in relative">
              {/* Header */}
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                 <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <UserPlus size={20} className="text-emerald-400" />
                    تعریف مشتری جدید
                 </h3>
                 <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-6">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setCustomerTypeTab('حقیقی')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${customerTypeTab === 'حقیقی' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <User size={16} />
                    شخص حقیقی
                  </button>
                  <button 
                    onClick={() => setCustomerTypeTab('حقوقی')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${customerTypeTab === 'حقوقی' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Building2 size={16} />
                    شخص حقوقی / شرکتی
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCustomer} className="p-6 space-y-6">
                 {/* Section 1: Identity */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">اطلاعات هویتی</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                             {customerTypeTab === 'حقیقی' ? 'نام و نام خانوادگی' : 'نام کامل شرکت'} <span className="text-red-500">*</span>
                          </label>
                          <input 
                             required
                             type="text"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                             placeholder={customerTypeTab === 'حقیقی' ? 'مثلاً: علی محمدی' : 'مثلاً: شرکت بازرگانی زرین'}
                             value={newCustomer.name}
                             onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                             {customerTypeTab === 'حقیقی' ? 'کد ملی' : 'شناسه ملی شرکت'}
                          </label>
                          <input 
                             type="number"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-sm"
                             placeholder={customerTypeTab === 'حقیقی' ? '0012345678' : '1010...'}
                             dir="ltr"
                             value={newCustomer.nationalId}
                             onChange={e => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                          />
                       </div>
                       {customerTypeTab === 'حقوقی' && (
                         <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-1">کد اقتصادی</label>
                            <input 
                               type="number"
                               className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-sm"
                               placeholder="411..."
                               dir="ltr"
                               value={newCustomer.economicCode}
                               onChange={e => setNewCustomer({...newCustomer, economicCode: e.target.value})}
                            />
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Section 2: Contact Info */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">اطلاعات تماس</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">شماره موبایل <span className="text-red-500">*</span></label>
                          <div className="relative">
                             <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                             <input 
                                required
                                type="tel"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-10 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-sm"
                                placeholder="0912..."
                                dir="ltr"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">پست الکترونیک (اختیاری)</label>
                          <input 
                             type="email"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-sm"
                             placeholder="email@example.com"
                             dir="ltr"
                             value={newCustomer.email}
                             onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Section 3: Address */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">نشانی و آدرس</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">استان</label>
                          <input 
                             type="text"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                             value={newCustomer.province}
                             onChange={e => setNewCustomer({...newCustomer, province: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">شهر</label>
                          <input 
                             type="text"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                             value={newCustomer.city}
                             onChange={e => setNewCustomer({...newCustomer, city: e.target.value})}
                          />
                       </div>
                       <div className="col-span-2">
                          <label className="block text-sm font-bold text-slate-700 mb-1">آدرس کامل</label>
                          <div className="relative">
                             <MapPin className="absolute right-3 top-3 text-slate-400 w-4 h-4" />
                             <textarea 
                                rows={2}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pr-10 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-sm"
                                placeholder="خیابان، کوچه، پلاک..."
                                value={newCustomer.address}
                                onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                             />
                          </div>
                       </div>
                       <div className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-bold text-slate-700 mb-1">کد پستی</label>
                          <input 
                             type="text"
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-sm"
                             dir="ltr"
                             value={newCustomer.postalCode}
                             onChange={e => setNewCustomer({...newCustomer, postalCode: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Section 4: Documents (KYC) */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">مدارک احراز هویت</h4>
                    <div 
                       className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging || uploadedFileName ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                       onDragOver={handleDragOver}
                       onDragLeave={handleDragLeave}
                       onDrop={handleDrop}
                       onClick={() => {
                          // Simulation of file click
                          if(!uploadedFileName) setUploadedFileName('Simulated_Document_Scan.jpg');
                       }}
                    >
                       {uploadedFileName ? (
                         <>
                           <FileCheck size={32} className="text-emerald-500 mb-2" />
                           <p className="text-sm font-bold text-emerald-700">فایل بارگذاری شد</p>
                           <p className="text-xs text-slate-500 mt-1">{uploadedFileName}</p>
                           <button 
                             type="button" 
                             onClick={(e) => { e.stopPropagation(); setUploadedFileName(null); }}
                             className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                           >
                             حذف فایل
                           </button>
                         </>
                       ) : (
                         <>
                           <UploadCloud size={32} className="text-slate-400 mb-2" />
                           <p className="text-sm font-medium text-slate-600">
                             تصویر کارت ملی یا روزنامه رسمی را اینجا رها کنید
                           </p>
                           <p className="text-xs text-slate-400 mt-1">یا برای انتخاب فایل کلیک کنید</p>
                         </>
                       )}
                    </div>
                 </div>

                 <div className="flex gap-3 pt-4 border-t border-slate-200">
                   <button 
                     type="button"
                     onClick={() => setShowAddCustomerModal(false)}
                     className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                   >
                     انصراف
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-colors shadow-lg shadow-slate-900/20"
                   >
                     ثبت نهایی مشتری
                   </button>
                 </div>
              </form>
           </div>
         </div>
        </div>
      )}

      {/* --- INVOICE MODAL (Reusable) --- */}
      <InvoiceModal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        data={lastInvoiceData} 
      />

    </div>
  );
};

export default PointOfSale;
