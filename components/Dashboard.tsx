
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Legend, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Wallet, Scale, 
  Coins, Activity 
} from 'lucide-react';
import { Item, Transaction, Product, MetalType, ItemStatus, TransactionType } from '../types';

interface DashboardProps {
  items: Item[];
  transactions: Transaction[];
  products: Product[];
  currentSpotGold: number;
  currentSpotSilver: number;
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, products, currentSpotGold, currentSpotSilver }) => {
  
  // --- Advanced Calculations ---
  const analytics = useMemo(() => {
    // 1. Inventory Analysis
    let invGoldWeight = 0;
    let invSilverWeight = 0;
    let invTotalValue = 0;

    const stockItems = items.filter(i => i.status === ItemStatus.InStock);
    
    stockItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (product.metalType === MetalType.Gold) {
          invGoldWeight += product.weightGrams;
          invTotalValue += product.weightGrams * currentSpotGold;
        } else {
          invSilverWeight += product.weightGrams;
          invTotalValue += product.weightGrams * currentSpotSilver;
        }
      }
    });

    // 2. Profit & Sales Analysis (Realized)
    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;
    let salesCount = 0;

    // Filter only completed sales
    const sales = transactions.filter(t => t.type === TransactionType.Sale && t.status === 'Completed');

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      salesCount++;

      // Calculate Cost of Goods Sold (COGS) based on specific Serial Numbers
      sale.lines.forEach(line => {
        if (line.itemSerialNumber) {
          const serials = line.itemSerialNumber.split(',').map(s => s.trim());
          
          serials.forEach(serial => {
            const soldItem = items.find(i => i.serialNumber === serial);
            if (soldItem) {
              totalCostOfGoodsSold += soldItem.costPrice;
            }
          });
        }
      });
    });

    const netProfitRials = totalRevenue - totalCostOfGoodsSold;
    const profitMargin = totalRevenue > 0 ? (netProfitRials / totalRevenue) * 100 : 0;
    
    // 3. Gold-Based Profit
    const goldProfitGrams = currentSpotGold > 0 ? (netProfitRials / currentSpotGold) : 0;

    // 4. Chart Data Preparation
    const salesByDate: Record<string, { date: string, revenue: number, profit: number }> = {};
    
    sales.forEach(sale => {
      const dateKey = sale.date.split('T')[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { date: dateKey, revenue: 0, profit: 0 };
      }
      
      let saleCost = 0;
      sale.lines.forEach(line => {
         if (line.itemSerialNumber) {
           const serials = line.itemSerialNumber.split(',').map(s => s.trim());
           serials.forEach(s => {
             const itm = items.find(i => i.serialNumber === s);
             if (itm) saleCost += itm.costPrice;
           });
         }
      });

      salesByDate[dateKey].revenue += sale.totalAmount;
      salesByDate[dateKey].profit += (sale.totalAmount - saleCost);
    });

    const chartData = Object.values(salesByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
      .map(d => ({
        name: new Date(d.date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        profit: d.profit,
        amt: d.revenue
      }));

    return {
      invGoldWeight,
      invSilverWeight,
      invTotalValue,
      totalRevenue,
      netProfitRials,
      profitMargin,
      goldProfitGrams,
      chartData,
      stockCount: stockItems.length,
      salesCount
    };
  }, [items, transactions, products, currentSpotGold, currentSpotSilver]);

  const inventoryCompositionData = [
    { name: 'طلا', value: analytics.invGoldWeight * currentSpotGold, color: '#fbbf24' },
    { name: 'نقره', value: analytics.invSilverWeight * currentSpotSilver, color: '#94a3b8' }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Top Section: 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Total Inventory Value */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-x-5 -translate-y-5"></div>
          <div>
             <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-xs font-medium">ارزش انبار</p>
                <Wallet className="w-5 h-5 text-emerald-400 opacity-80" />
             </div>
             <h3 className="text-2xl font-bold tracking-tight">
               {analytics.invTotalValue.toLocaleString('fa-IR')}
             </h3>
             <p className="text-xs text-slate-500 mt-1">ریال</p>
          </div>
          <div className="mt-4 flex gap-2">
             <div className="bg-white/10 rounded px-2 py-1 text-xs text-slate-300 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                <span>{analytics.invGoldWeight.toLocaleString('fa-IR', {maximumFractionDigits: 1})} گرم</span>
             </div>
             <div className="bg-white/10 rounded px-2 py-1 text-xs text-slate-300 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                <span>{analytics.invSilverWeight.toLocaleString('fa-IR', {maximumFractionDigits: 1})} گرم</span>
             </div>
          </div>
        </div>

        {/* 2. Total Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-slate-500 text-xs font-bold">فروش کل (دوره)</p>
                 <Activity className="w-5 h-5 text-indigo-500 opacity-80" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">
                {analytics.totalRevenue.toLocaleString('fa-IR')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">ریال</p>
           </div>
           <div className="mt-4">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                 {analytics.salesCount.toLocaleString('fa-IR')} فاکتور موفق
              </span>
           </div>
        </div>

        {/* 3. Net Profit (Rials) - NEW CARD */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-emerald-800 text-xs font-bold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    سود خالص (ریالی)
                 </p>
                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${analytics.profitMargin >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                    {analytics.profitMargin.toLocaleString('fa-IR', {maximumFractionDigits: 1})}%
                 </span>
              </div>
              <h3 className={`text-2xl font-bold tracking-tight ${analytics.netProfitRials >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {analytics.netProfitRials > 0 ? '+' : ''}{analytics.netProfitRials.toLocaleString('fa-IR')}
              </h3>
              <p className="text-xs text-emerald-600/70 mt-1">ریال</p>
           </div>
           <div className="mt-4 text-xs text-emerald-700">
              مابه‎‌التفاوت فروش و خرید
           </div>
        </div>

        {/* 4. Gold Growth (Gold Profit) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-start mb-2">
                 <p className="text-amber-900 text-xs font-bold flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    رشد سرمایه (طلایی)
                 </p>
              </div>
              <h3 className="text-2xl font-bold text-amber-600 tracking-tight">
                +{analytics.goldProfitGrams.toLocaleString('fa-IR', {maximumFractionDigits: 3})}
              </h3>
              <p className="text-xs text-amber-700/70 mt-1">گرم طلا</p>
           </div>
           <div className="mt-4 text-xs text-amber-800 bg-amber-100/50 px-2 py-1 rounded-md inline-block">
              قدرت خرید اضافه شده
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-emerald-600" />
               روند سودآوری و فروش
             </h3>
             <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                  <span>سود خالص</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-indigo-100 border border-indigo-300 rounded-sm"></div>
                  <span>کل فروش</span>
                </div>
             </div>
           </div>
           
           <div className="h-80" dir="ltr">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={analytics.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }} 
                    dy={10}
                 />
                 <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }} 
                    tickFormatter={(value) => `${(value / 1000000).toLocaleString('fa-IR')} م`}
                 />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Vazirmatn', textAlign: 'right' }}
                   cursor={{ fill: '#f8fafc' }}
                   formatter={(value: number, name: string) => [
                     `${value.toLocaleString('fa-IR')} ریال`, 
                     name === 'profit' ? 'سود خالص' : 'فروش کل'
                   ]}
                 />
                 <Bar dataKey="revenue" barSize={40} fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                 <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
               </ComposedChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Side Panel: Inventory Insights */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 text-sm">ترکیب موجودی (ارزش)</h3>
             
             {/* Redesigned Chart: Donut Chart with Center Text */}
             <div className="relative h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={inventoryCompositionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {inventoryCompositionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => value.toLocaleString('fa-IR') + ' ریال'}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Vazirmatn', textAlign: 'right' }}
                        itemStyle={{ color: '#1e293b' }}
                      />
                   </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label for Donut Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 mb-1">ارزش کل</span>
                    <span className="text-lg font-bold text-slate-700">
                      {(analytics.invTotalValue / 1000000).toLocaleString('fa-IR', {maximumFractionDigits: 0})} م
                    </span>
                    <span className="text-[10px] text-slate-400">ریال</span>
                </div>
             </div>

             <div className="space-y-3 mt-2">
                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm shadow-yellow-200"></div>
                      <span className="text-slate-600 font-medium">طلا</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-slate-800 font-bold">
                        {((analytics.invGoldWeight * currentSpotGold / (analytics.invTotalValue || 1)) * 100).toLocaleString('fa-IR', {maximumFractionDigits: 1})}%
                      </span>
                      <span className="text-[10px] text-slate-400">{(analytics.invGoldWeight * currentSpotGold).toLocaleString('fa-IR')}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-slate-400 rounded-full shadow-sm shadow-slate-200"></div>
                      <span className="text-slate-600 font-medium">نقره</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-slate-800 font-bold">
                        {((analytics.invSilverWeight * currentSpotSilver / (analytics.invTotalValue || 1)) * 100).toLocaleString('fa-IR', {maximumFractionDigits: 1})}%
                      </span>
                      <span className="text-[10px] text-slate-400">{(analytics.invSilverWeight * currentSpotSilver).toLocaleString('fa-IR')}</span>
                   </div>
                </div>
             </div>
           </div>

           <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
              <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center">
                 <Scale className="w-4 h-4 ml-2" />
                 وضعیت تعادل
              </h4>
              <p className="text-xs text-indigo-700 leading-5 mb-3">
                 بر اساس فروش اخیر، تقاضا برای شمش‌های ۱ گرمی بیشتر بوده است. پیشنهاد می‌شود سود طلایی ({analytics.goldProfitGrams.toLocaleString('fa-IR', {maximumFractionDigits: 2})} گرم) صرف شارژ این محصول شود.
              </p>
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors">
                 مشاهده لیست سفارش پیشنهادی
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
