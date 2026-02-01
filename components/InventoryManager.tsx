
import React, { useState, useEffect } from 'react';
import { Item, Product, ItemStatus, MetalType, TransactionType } from '../types';
import { Package, Search, Plus, Filter, AlertCircle, Box, X, Calculator, Percent, Hash } from 'lucide-react';

interface InventoryManagerProps {
  items: Item[];
  products: Product[];
  onAddStock: (product: Product, serials: string[], costPerItem: number, supplier: string) => void;
  onAddProduct?: (product: Omit<Product, 'id'>) => void;
  currentSpotGold?: number;
  currentSpotSilver?: number;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  items, products, onAddStock, onAddProduct, currentSpotGold = 0, currentSpotSilver = 0 
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'products'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  // Stock In Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [inputSerials, setInputSerials] = useState(''); // Comma separated
  const [costPrice, setCostPrice] = useState<string>('');
  const [supplierName, setSupplierName] = useState('');

  // Stock In Cost Calculation State
  const [isCalculatedMode, setIsCalculatedMode] = useState(true);
  const [ojoratType, setOjoratType] = useState<'PERCENT' | 'FIXED_PER_GRAM'>('FIXED_PER_GRAM');
  const [ojoratValue, setOjoratValue] = useState<string>('2100000'); // Updated default to 2,100,000

  // New Product Form State
  const initialProductState = {
    name: '',
    metalType: MetalType.Gold,
    weightGrams: '',
    purity: '',
    manufacturer: '',
    packaging: 'وکیوم',
    sku: ''
  };
  const [newProduct, setNewProduct] = useState(initialProductState);

  // --- Calculations for Stock In ---
  useEffect(() => {
    if (showAddStockModal && isCalculatedMode && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        const spotPrice = product.metalType === MetalType.Gold ? currentSpotGold : currentSpotSilver;
        const weight = product.weightGrams;
        const ojorat = parseFloat(ojoratValue) || 0;
        
        let calculatedCost = 0;
        
        if (ojoratType === 'FIXED_PER_GRAM') {
           // (Spot + Ojorat) * Weight
           calculatedCost = (spotPrice + ojorat) * weight;
        } else {
           // Spot * Weight * (1 + Percent/100)
           const basePrice = spotPrice * weight;
           calculatedCost = basePrice + (basePrice * (ojorat / 100));
        }
        
        setCostPrice(Math.floor(calculatedCost).toString());
      }
    }
  }, [showAddStockModal, isCalculatedMode, selectedProductId, ojoratType, ojoratValue, currentSpotGold, currentSpotSilver, products]);

  const filteredItems = items.filter(item => {
    const product = products.find(p => p.id === item.productId);
    const searchString = `${item.serialNumber} ${product?.name}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProductId);
    if (!product || !inputSerials) return;

    const serialList = inputSerials.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const price = parseFloat(costPrice) || 0; // Handle empty or NaN
    
    // Check for duplicates in existing items
    const duplicates = serialList.filter(s => items.some(i => i.serialNumber === s));
    if (duplicates.length > 0) {
      alert(`خطا: شماره سریال‌های زیر تکراری هستند: ${duplicates.join(', ')}`);
      return;
    }

    onAddStock(product, serialList, price, supplierName);
    setShowAddStockModal(false);
    setInputSerials('');
    setCostPrice('');
    setSupplierName('');
    setIsCalculatedMode(true);
    setOjoratValue('2100000');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.weightGrams || !newProduct.purity) return;
    
    if (onAddProduct) {
      onAddProduct({
        name: newProduct.name,
        metalType: newProduct.metalType,
        weightGrams: parseFloat(newProduct.weightGrams),
        purity: parseFloat(newProduct.purity),
        manufacturer: newProduct.manufacturer,
        packaging: newProduct.packaging,
        sku: newProduct.sku
      });
      setShowAddProductModal(false);
      setNewProduct(initialProductState);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">مدیریت موجودی انبار</h2>
          <p className="text-slate-500 mt-1">مدیریت محصولات، موجودی فیزیکی و ورود کالای جدید</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
          >
            <Box className="w-5 h-5 ml-2 text-indigo-500" />
            تعریف محصول جدید
          </button>
          <button 
            onClick={() => setShowAddStockModal(true)}
            className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-5 h-5 ml-2" />
            ورود کالا به انبار (خرید)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'items' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('items')}
        >
          موجودی فیزیکی (شماره سریال)
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'products' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('products')}
        >
          کاتالوگ محصولات
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={activeTab === 'items' ? "جستجو بر اساس شماره سریال..." : "جستجوی نام محصول..."}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium bg-white">
          <Filter className="w-4 h-4 ml-2" />
          فیلتر پیشرفته
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'items' ? (
          <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600">شماره سریال</th>
                <th className="px-6 py-4 font-bold text-slate-600">محصول</th>
                <th className="px-6 py-4 font-bold text-slate-600">وزن</th>
                <th className="px-6 py-4 font-bold text-slate-600">مکان</th>
                <th className="px-6 py-4 font-bold text-slate-600">وضعیت</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-left">قیمت خرید</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <tr key={item.serialNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700" dir="ltr">{item.serialNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ml-2 ${product?.metalType === MetalType.Gold ? 'bg-yellow-400 shadow-sm shadow-yellow-200' : 'bg-slate-400'}`}></div>
                        <span className="font-medium text-slate-800">{product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500" dir="ltr">{product?.weightGrams}g</td>
                    <td className="px-6 py-4 text-slate-500">{item.location}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold 
                        ${item.status === ItemStatus.InStock ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                          item.status === ItemStatus.Sold ? 'bg-slate-100 text-slate-600 border border-slate-200' : 
                          'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-slate-600" dir="ltr">{item.costPrice.toLocaleString()}</td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        موردی یافت نشد.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
             <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-600">نام محصول</th>
                <th className="px-6 py-4 font-bold text-slate-600">فلز</th>
                <th className="px-6 py-4 font-bold text-slate-600">سازنده / برند</th>
                <th className="px-6 py-4 font-bold text-slate-600">وزن</th>
                <th className="px-6 py-4 font-bold text-slate-600">عیار</th>
                <th className="px-6 py-4 font-bold text-slate-600">موجودی فعلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(prod => (
                     <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{prod.name}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${prod.metalType === MetalType.Gold ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                {prod.metalType}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{prod.manufacturer}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{prod.weightGrams}g</td>
                        <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{prod.purity}</td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                              {items.filter(i => i.productId === prod.id && i.status === ItemStatus.InStock).length.toLocaleString('fa-IR')}
                           </span>
                        </td>
                     </tr>
                ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD STOCK (Updated with Cost Calculator) */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in relative">
            <button onClick={() => setShowAddStockModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <div className="p-6 border-b border-slate-100">
               <h3 className="text-xl font-bold text-slate-800 flex items-center">
                 <Package className="w-6 h-6 ml-2 text-emerald-600"/> 
                 ورود کالا به انبار
               </h3>
               <p className="text-sm text-slate-500 mt-1">اضافه کردن موجودی فیزیکی به محصولات تعریف شده</p>
            </div>
            
            <form onSubmit={handleStockInSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">انتخاب محصول</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.weightGrams}g)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">تأمین کننده</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="مثلاً: بنکداری زرین"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره سریال‌ها</label>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-2 flex gap-2 items-start">
                   <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                   <p className="text-xs text-amber-700">سریال‌ها را با ویرگول یا خط فاصله جدا کنید. سریال تکراری ثبت نخواهد شد.</p>
                </div>
                <textarea 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium font-mono text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                  rows={2}
                  value={inputSerials}
                  onChange={e => setInputSerials(e.target.value)}
                  placeholder="SN-1001, SN-1002, ..."
                  dir="ltr"
                />
              </div>

              {/* Cost Calculation Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                 <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-bold text-slate-700">محاسبه قیمت تمام شده</label>
                    <button 
                      type="button"
                      onClick={() => setIsCalculatedMode(!isCalculatedMode)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-colors ${isCalculatedMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                    >
                       {isCalculatedMode ? 'حالت خودکار (اجرت)' : 'حالت دستی'}
                    </button>
                 </div>

                 {isCalculatedMode ? (
                   <div className="space-y-3 animate-fade-in">
                      <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => { setOjoratType('FIXED_PER_GRAM'); setOjoratValue('2100000'); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${ojoratType === 'FIXED_PER_GRAM' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <Hash size={14} />
                           اجرت ریالی (هر گرم)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOjoratType('PERCENT'); setOjoratValue('7'); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${ojoratType === 'PERCENT' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <Percent size={14} />
                           اجرت درصدی
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="number"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 pl-10 text-slate-800 font-bold text-left focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={ojoratValue}
                          onChange={(e) => setOjoratValue(e.target.value)}
                          dir="ltr"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                           {ojoratType === 'PERCENT' ? '%' : 'ریال'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                         <span>فرمول:</span>
                         <span dir="ltr">
                           {ojoratType === 'FIXED_PER_GRAM' 
                             ? '(Spot + Ojorat) × Weight'
                             : '(Spot × Weight) + Percent'
                           }
                         </span>
                      </div>
                   </div>
                 ) : (
                    <div className="text-xs text-slate-400 text-center py-2">
                       قیمت نهایی را به صورت دستی وارد کنید.
                    </div>
                 )}
              </div>

              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5 flex justify-between">
                    قیمت خرید هر واحد (ریال)
                    {isCalculatedMode && <Calculator size={14} className="text-emerald-500"/>}
                 </label>
                 <input 
                  required
                  type="number" 
                  className={`w-full border rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none ${isCalculatedMode ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  dir="ltr"
                  placeholder="مثلاً: 35000000"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddStockModal(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  انصراف
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  ثبت خرید و موجودی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PRODUCT (New Feature) */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in relative">
            <button onClick={() => setShowAddProductModal(false)} className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
               <h3 className="text-xl font-bold text-slate-800 flex items-center">
                 <Box className="w-6 h-6 ml-2 text-indigo-500"/> 
                 تعریف محصول جدید
               </h3>
               <p className="text-sm text-slate-500 mt-1">افزودن کالای جدید به لیست محصولات (کاتالوگ)</p>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 
                 <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">نام محصول <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="مثلاً: شمش طلا ۱ گرمی پارسیس"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">نوع فلز</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.metalType}
                      onChange={e => setNewProduct({...newProduct, metalType: e.target.value as MetalType})}
                    >
                       <option value={MetalType.Gold}>طلا</option>
                       <option value={MetalType.Silver}>نقره</option>
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">تامین کننده / برند</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.manufacturer}
                      onChange={e => setNewProduct({...newProduct, manufacturer: e.target.value})}
                      placeholder="مثلاً: PAMP, پارسیس"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">وزن (گرم) <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="number" 
                      step="0.001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.weightGrams}
                      onChange={e => setNewProduct({...newProduct, weightGrams: e.target.value})}
                      placeholder="0.000"
                      dir="ltr"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">عیار <span className="text-red-500">*</span></label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.purity}
                      onChange={e => setNewProduct({...newProduct, purity: e.target.value})}
                      placeholder="مثلاً: 995 یا 750"
                      dir="ltr"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">بسته‌بندی</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.packaging}
                      onChange={e => setNewProduct({...newProduct, packaging: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">شناسه کالا (SKU) <span className="text-xs text-slate-400 font-normal">(اختیاری)</span></label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={newProduct.sku}
                      onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                      placeholder="CODE-123"
                      dir="ltr"
                    />
                 </div>

              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  انصراف
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  افزودن محصول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryManager;
