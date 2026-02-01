
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Customer, Product, Item, InvoiceData } from '../types';
import { 
  Calendar, Search, Printer, ChevronDown, 
  FileText, ArrowUpRight, Filter, Download, Box
} from 'lucide-react';
import InvoiceModal from './InvoiceModal';

interface SalesHistoryProps {
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  items: Item[];
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ transactions, customers, products, items }) => {
  
  // --- State ---
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Invoice Modal State
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<InvoiceData | null>(null);

  // --- Helpers ---
  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('fa-IR').format(val);
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('fa-IR');

  // --- Filtering Logic ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== TransactionType.Sale) return false;
      
      const tDate = t.date.split('T')[0];
      const inDateRange = tDate >= dateRange.start && tDate <= dateRange.end;
      
      const customer = customers.find(c => c.id === t.customerId);
      const customerName = customer ? customer.name.toLowerCase() : '';
      const matchesSearch = 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        customerName.includes(searchTerm.toLowerCase()) ||
        t.lines.some(l => l.itemSerialNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

      return inDateRange && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, dateRange, searchTerm, customers]);

  // --- Statistics ---
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const count = filteredTransactions.length;
    const avgTicket = count > 0 ? totalRevenue / count : 0;
    return { totalRevenue, count, avgTicket };
  }, [filteredTransactions]);

  // --- Actions ---
  const handlePrint = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    const customer = customers.find(c => c.id === transaction.customerId);
    
    const invoiceItems = transaction.lines.map((line, index) => {
      const product = products.find(p => p.id === line.productId);
      return {
        row: index + 1,
        desc: product ? product.name : 'کالای نامشخص',
        serial: line.itemSerialNumber,
        weight: product ? product.weightGrams : 0,
        purity: product ? product.purity : 0,
        price: line.unitPrice,
        total: line.subtotal
      };
    });

    const invoiceData: InvoiceData = {
      id: transaction.id,
      date: new Date(transaction.date).toLocaleDateString('fa-IR'),
      customer: customer || { id: 'unknown', name: 'ناشناس', type: 'حقیقی', phone: '-' },
      items: invoiceItems,
      totalAmount: transaction.totalAmount
    };

    setSelectedInvoiceData(invoiceData);
    setShowInvoice(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* 1. Header & Stats Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">تاریخچه تراکنش‌ها</h2>
            <p className="text-slate-500 text-sm mt-1">مدیریت و بایگانی فاکتورهای فروش</p>
          </div>
          <button className="hidden sm:flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            <Download size={16} />
            خروجی اکسل
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-slate-500 text-xs mb-1">مجموع فروش (فیلتر شده)</p>
               <h3 className="text-xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue)}</h3>
               <span className="text-[10px] text-slate-400">ریال</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
               <ArrowUpRight size={20} />
             </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-slate-500 text-xs mb-1">تعداد فاکتورها</p>
               <h3 className="text-xl font-bold text-slate-800">{stats.count}</h3>
               <span className="text-[10px] text-slate-400">عدد</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
               <FileText size={20} />
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-slate-500 text-xs mb-1">میانگین هر فاکتور</p>
               <h3 className="text-xl font-bold text-slate-800">{formatCurrency(Math.round(stats.avgTicket))}</h3>
               <span className="text-[10px] text-slate-400">ریال</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
               <Filter size={20} />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Advanced Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="جستجو (نام مشتری، شماره فاکتور، سریال کالا)..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-xs text-slate-500">از:</span>
            <input 
              type="date" 
              className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-700 font-medium w-24"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <span className="text-xs text-slate-500">تا:</span>
            <input 
              type="date" 
              className="bg-transparent border-none p-0 text-sm focus:ring-0 text-slate-700 font-medium w-24"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* 3. Enhanced Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">شماره فاکتور / تاریخ</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">مشتری</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">خلاصه اقلام</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">وضعیت</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">مبلغ کل (ریال)</th>
              <th className="px-6 py-4 text-center w-24">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((t) => {
              const customer = customers.find(c => c.id === t.customerId);
              const isExpanded = expandedRowId === t.id;
              
              // Item Summary Logic
              const itemCount = t.lines.length;
              const firstLineProd = products.find(p => p.id === t.lines[0]?.productId);
              const summaryText = firstLineProd 
                ? `${firstLineProd.name}` + (itemCount > 1 ? ` (+${itemCount - 1} مورد دیگر)` : '')
                : `${itemCount} قلم کالا`;

              return (
                <React.Fragment key={t.id}>
                  {/* Main Row */}
                  <tr 
                    onClick={() => toggleRow(t.id)}
                    className={`cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700" dir="ltr">{t.id}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{formatDate(t.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{customer?.name || 'مشتری ناشناس'}</span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{customer?.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Box size={16} className="text-slate-400" />
                        <span>{summaryText}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        t.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Completed' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {t.status === 'Completed' ? 'پرداخت شده' : 'لغو شده'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="font-bold text-slate-800 text-base tracking-tight">
                        {formatCurrency(t.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => handlePrint(e, t)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                          title="چاپ فاکتور"
                        >
                          <Printer size={18} />
                        </button>
                        <div className={`p-2 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-slate-600' : ''}`}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50 shadow-inner">
                      <td colSpan={6} className="px-6 py-4 pb-6">
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden animate-fade-in-up">
                          <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                              <FileText size={14} />
                              جزئیات اقلام فاکتور
                            </span>
                            <span className="text-xs font-mono text-slate-400" dir="ltr">Ref: {t.id}</span>
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="px-4 py-2 text-right text-slate-500">#</th>
                                <th className="px-4 py-2 text-right text-slate-500">کالا</th>
                                <th className="px-4 py-2 text-center text-slate-500">شماره سریال</th>
                                <th className="px-4 py-2 text-center text-slate-500">تعداد</th>
                                <th className="px-4 py-2 text-left text-slate-500">قیمت واحد (ریال)</th>
                                <th className="px-4 py-2 text-left text-slate-500">جمع کل (ریال)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.lines.map((line, idx) => {
                                const product = products.find(p => p.id === line.productId);
                                return (
                                  <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-400 w-10">{idx + 1}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700">
                                      {product?.name || 'محصول حذف شده'}
                                      <span className="block text-[10px] text-slate-400 mt-0.5">
                                        {product?.metalType} | {product?.weightGrams}g | {product?.purity}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {line.itemSerialNumber ? (
                                        <div className="flex flex-wrap gap-1 justify-center">
                                          {line.itemSerialNumber.split(',').map((sn, i) => (
                                            <span key={i} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600" dir="ltr">
                                              {sn.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">{line.quantity}</td>
                                    <td className="px-4 py-3 text-left text-slate-600">{formatCurrency(line.unitPrice)}</td>
                                    <td className="px-4 py-3 text-left font-bold text-slate-800">{formatCurrency(line.subtotal)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-slate-50">
                               <tr>
                                 <td colSpan={5} className="px-4 py-2 text-left font-bold text-slate-600">جمع کل پرداخت شده:</td>
                                 <td className="px-4 py-2 text-left font-bold text-emerald-600 text-sm">{formatCurrency(t.totalAmount)}</td>
                               </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 mb-2 opacity-50" />
                    <p>هیچ تراکنشی با این مشخصات یافت نشد.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Shared Invoice Modal */}
      <InvoiceModal 
        isOpen={showInvoice} 
        onClose={() => setShowInvoice(false)} 
        data={selectedInvoiceData} 
      />
    </div>
  );
};

export default SalesHistory;
