
import React, { useState } from 'react';
import { Item, Product, Customer, ItemStatus, TransactionType, MetalType } from '../types';
import { RefreshCw, Search, Calculator, Percent, Hash, ArrowDown, Info } from 'lucide-react';

interface BuybackManagerProps {
  items: Item[];
  products: Product[];
  customers: Customer[];
  currentSpotGold: number;
  currentSpotSilver: number;
  onCompleteBuyback: (product: Product, serial: string, price: number, customerId: string) => void;
}

const BuybackManager: React.FC<BuybackManagerProps> = ({
  items, products, customers, currentSpotGold, currentSpotSilver, onCompleteBuyback
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [serialInput, setSerialInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products.length > 0 ? products[0].id : '');
  
  // Calculation State
  const [packagingFee, setPackagingFee] = useState<number>(0); 
  const [condition, setCondition] = useState('Sealed');
  const [marginType, setMarginType] = useState<'PERCENT' | 'FIXED_PER_GRAM'>('PERCENT');
  const [marginValue, setMarginValue] = useState<number>(1.5); // Default 1.5% below spot

  // Try to find if the item exists in our DB (Sold status)
  const existingItem = items.find(i => i.serialNumber === serialInput);
  
  const selectedProduct = products.find(p => p.id === (existingItem ? existingItem.productId : selectedProductId));

  // --- Calculation Logic ---
  const spotPrice = selectedProduct?.metalType === MetalType.Gold ? currentSpotGold : currentSpotSilver;
  const weight = selectedProduct?.weightGrams || 0;
  
  // 1. Base Value (Weight * Spot)
  const baseValue = weight * spotPrice;

  // 2. Calculate Deduction (Profit Margin / Ojorat Deduction)
  let deductionAmount = 0;
  if (marginType === 'PERCENT') {
     deductionAmount = baseValue * (marginValue / 100);
  } else {
     // Fixed amount deducted per gram (e.g. 50,000 Toman per gram)
     deductionAmount = weight * marginValue;
  }

  // 3. Final Price
  const finalPrice = Math.floor(baseValue - deductionAmount - packagingFee);

  const handleBuyback = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalPrice <= 0) return alert("محاسبه قیمت نامعتبر است");
    if (!serialInput) return alert("شماره سریال الزامی است");
    
    const productToUse = existingItem ? products.find(p => p.id === existingItem.productId)! : products.find(p => p.id === selectedProductId)!;

    if (!productToUse) {
       alert('محصول انتخاب نشده است.');
       return;
    }

    if (window.confirm(`تایید بازخرید ${productToUse.name} (${serialInput}) به مبلغ ${finalPrice.toLocaleString()} ریال؟`)) {
      onCompleteBuyback(productToUse, serialInput, finalPrice, selectedCustomerId);
      setSerialInput('');
      setPackagingFee(0);
      setMarginValue(1.5);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg text-slate-900">
                <RefreshCw className="w-6 h-6" />
              </div>
              بازخرید از مشتری
            </h2>
            <p className="text-slate-400 mt-1 text-sm mr-12">محاسبه دقیق قیمت بر اساس نرخ تابلو و کسر سود</p>
          </div>
          
          <div className="text-left relative z-10 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mb-1">نرخ لحظه‌ای (Spot)</p>
            <div className="flex gap-4">
               <div>
                  <span className="text-[10px] text-amber-400 block">طلا (گرم)</span>
                  <span className="font-mono font-bold text-lg" dir="ltr">{currentSpotGold.toLocaleString()}</span>
               </div>
               <div className="w-px bg-white/20"></div>
               <div>
                  <span className="text-[10px] text-slate-300 block">نقره (گرم)</span>
                  <span className="font-mono font-bold text-lg" dir="ltr">{currentSpotSilver.toLocaleString()}</span>
               </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleBuyback} className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input Fields */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customer & Serial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">مشتری</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 transition-colors outline-none"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">شماره سریال</label>
                <div className="relative">
                   <input 
                    type="text" 
                    className={`w-full bg-slate-50 border rounded-xl p-3 pr-10 text-slate-700 font-medium font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${existingItem ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-2 focus:ring-amber-500'}`}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    placeholder="اسکن بارکد..."
                    dir="ltr"
                    autoFocus
                  />
                  <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 ${existingItem ? 'text-emerald-500' : 'text-slate-400'}`} />
                </div>
                {existingItem && (
                  <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center">
                    <Info size={12} className="ml-1"/>
                    کالا در سیستم شناسایی شد
                  </p>
                )}
              </div>
            </div>

            {/* Product Select (If manual) */}
            {!existingItem && (
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <label className="block text-sm font-bold text-amber-900 mb-1.5 flex items-center">
                  انتخاب محصول (ورود دستی)
                  <span className="mr-2 text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">کالا در دیتابیس یافت نشد</span>
                </label>
                <select 
                  className="w-full bg-white border border-amber-200 rounded-xl p-3 text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 transition-colors outline-none"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.weightGrams} گرم</option>
                  ))}
                </select>
              </div>
            )}

            {/* Config: Margin & Fees */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Calculator size={18} className="text-slate-400"/>
                 تنظیمات محاسبه قیمت
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Margin Mode */}
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-2">روش کسر از تابلو (سود خرید)</label>
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => { setMarginType('PERCENT'); setMarginValue(1.5); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${marginType === 'PERCENT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <Percent size={14} />
                           درصدی
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMarginType('FIXED_PER_GRAM'); setMarginValue(50000); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${marginType === 'FIXED_PER_GRAM' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <Hash size={14} />
                           مبلغی (از فی)
                        </button>
                     </div>
                  </div>

                  {/* Margin Value Input */}
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-2">
                        {marginType === 'PERCENT' ? 'درصد کسر از تابلو (%)' : 'مبلغ کسر از هر گرم (ریال)'}
                     </label>
                     <input 
                        type="number"
                        step={marginType === 'PERCENT' ? "0.1" : "1000"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold text-left focus:ring-2 focus:ring-amber-500 outline-none"
                        value={marginValue}
                        onChange={(e) => setMarginValue(parseFloat(e.target.value) || 0)}
                        dir="ltr"
                     />
                  </div>

                  {/* Packaging Fee */}
                  <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-500 mb-2">کسورات متفرقه / هزینه پک (ریال)</label>
                     <input 
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold text-left focus:ring-2 focus:ring-amber-500 outline-none"
                        value={packagingFee}
                        onChange={(e) => setPackagingFee(parseFloat(e.target.value) || 0)}
                        dir="ltr"
                        placeholder="0"
                     />
                  </div>
               </div>
            </div>

            <div>
               <label className="block text-sm font-bold text-slate-700 mb-1.5">وضعیت ظاهری</label>
               <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-amber-500 transition-colors outline-none"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
               >
                 <option>وکیوم / بانکی (بدون کسر اضافه)</option>
                 <option>باز شده / سالم</option>
                 <option>آسیب دیده (آبشده)</option>
               </select>
            </div>
          </div>

          {/* RIGHT COLUMN: Receipt / Calculation Breakdown */}
          <div className="lg:col-span-5">
             <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-full flex flex-col relative overflow-hidden">
                {/* Visual Header */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-6 relative z-10">صورتحساب بازخرید</h3>
                
                {/* Product Info */}
                <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative z-10">
                   <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${selectedProduct?.metalType === MetalType.Gold ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                      <span className="font-bold text-xs">{selectedProduct?.metalType || '?'}</span>
                   </div>
                   <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{selectedProduct?.name || 'محصولی انتخاب نشده'}</p>
                      <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{selectedProduct?.weightGrams || 0}g  |  {selectedProduct?.purity || 0}</p>
                   </div>
                </div>

                {/* Calculation Table */}
                <div className="space-y-3 relative z-10 flex-1">
                   {/* Row 1: Base */}
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">ارزش پایه (وزن × تابلو)</span>
                      <span className="font-mono font-medium text-slate-700">{Math.floor(baseValue).toLocaleString()}</span>
                   </div>
                   
                   {/* Row 2: Deduction */}
                   <div className="flex justify-between items-center text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                      <span className="flex items-center gap-1">
                         <ArrowDown size={14} />
                         {marginType === 'PERCENT' ? `کسر سود (${marginValue}%)` : `کسر از فی (${marginValue.toLocaleString()})`}
                      </span>
                      <span className="font-mono font-bold">-{Math.floor(deductionAmount).toLocaleString()}</span>
                   </div>

                   {/* Row 3: Packaging */}
                   {packagingFee > 0 && (
                      <div className="flex justify-between items-center text-sm text-red-600 px-2">
                         <span>هزینه پک / متفرقه</span>
                         <span className="font-mono">-{packagingFee.toLocaleString()}</span>
                      </div>
                   )}
                   
                   <div className="my-4 border-t border-dashed border-slate-300"></div>

                   {/* Final Total */}
                   <div className="flex justify-between items-end">
                      <span className="text-slate-800 font-bold">مبلغ قابل پرداخت</span>
                      <div className="text-right">
                         <span className="block text-2xl font-bold text-slate-900 tracking-tight" dir="ltr">
                           {finalPrice > 0 ? finalPrice.toLocaleString() : '0'}
                         </span>
                         <span className="text-xs text-slate-400">ریال</span>
                      </div>
                   </div>
                </div>

                {/* Action Button */}
                <button 
                  type="submit"
                  disabled={finalPrice <= 0 || !selectedProduct}
                  className="mt-8 w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center relative z-10"
                >
                  <RefreshCw className="w-5 h-5 ml-2" />
                  ثبت سند بازخرید
                </button>
             </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BuybackManager;
