
import React from 'react';
import { InvoiceData } from '../types';
import { Printer, CheckCircle, X, Phone, MapPin, Hash, Globe, Mail } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(num);
  const formatCurrency = (num: number) => new Intl.NumberFormat('fa-IR').format(num);

  const displayDate = data.date || new Date().toLocaleDateString('fa-IR');

  // Calculations
  const subTotal = data.totalAmount;
  const discount = 0; 
  const tax = 0; 
  const finalTotal = subTotal - discount + tax;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] backdrop-blur-sm overflow-y-auto print:static print:overflow-visible print:bg-white">
      <div className="flex min-h-full items-center justify-center p-4 print:p-0 print:block">
        
        {/* Modal Container */}
        <div className="bg-white w-full max-w-[1100px] rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none animate-scale-in relative">
        
        {/* Screen-only Controls */}
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" />
            پیش‌نمایش فاکتور
          </h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-bold transition-colors shadow-lg shadow-slate-900/20">
              <Printer size={18} />
              چاپ فاکتور
            </button>
            <button onClick={onClose} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm font-medium">
              <X size={18} />
              بستن
            </button>
          </div>
        </div>

        {/* Print Content - A4 Landscape Optimized */}
        <div className="p-8 print:p-0 font-sans" id="invoice-section">
          <style>{`
            @media print {
              @page { size: A4 landscape; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              #invoice-section { padding: 15mm; width: 297mm; height: 210mm; position: relative; }
              
              /* Print Optimizations (Ink Saving) */
              .print-box-border { border: 2px solid #000 !important; background-color: #fff !important; color: #000 !important; box-shadow: none !important; }
              .print-text-black { color: #000 !important; }
              .print-border-black { border-color: #000 !important; }
              .print-header-simple { background-color: #fff !important; color: #000 !important; border-top: 2px solid #000 !important; border-bottom: 2px solid #000 !important; }
              .print-row-stripe:nth-child(even) { background-color: #f3f3f3 !important; }
              .print-hidden { display: none !important; }
            }
          `}</style>
          
          {/* --- HEADER --- */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 print:border-black pb-5 mb-6">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-5">
              <img 
                src="https://abrehamrahi.ir/o/public/2GmCGAmW/" 
                alt="Iran Gold House Logo" 
                className="h-24 w-auto object-contain print:grayscale"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight print:text-black">خانه طلا ایران</h1>
                <p className="text-xs font-bold text-slate-500 mt-1 print:text-black">صاحب امتیاز: شرکت همیار انرژی خاورمیانه</p>
                <div className="flex gap-3 mt-2 text-[10px] text-slate-500 font-medium print:text-black">
                  <span className="bg-slate-100 px-2 py-0.5 rounded print:bg-transparent print:border print:border-slate-400">شماره ثبت: ۴۵۳۶۱۴</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded print:bg-transparent print:border print:border-slate-400">شناسه ملی: ۱۴۰۰۳۹۲۶۸۵۱</span>
                </div>
              </div>
            </div>

            {/* Invoice Meta Data */}
            <div className="text-left space-y-2">
               <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest absolute top-10 left-1/2 -translate-x-1/2 opacity-50 print:hidden pointer-events-none">INVOICE</h2>
               
               <div className="bg-slate-900 text-white px-6 py-3 rounded-l-xl shadow-sm print-box-border">
                  <div className="flex justify-between items-center gap-8 mb-1">
                     <span className="text-xs text-slate-400 print:text-black">شماره فاکتور</span>
                     <span className="font-mono font-bold text-lg" dir="ltr">{data.id}</span>
                  </div>
                  <div className="flex justify-between items-center gap-8">
                     <span className="text-xs text-slate-400 print:text-black">تاریخ صدور</span>
                     <span className="font-mono font-bold">{displayDate}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* --- INFO GRID --- */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            
            {/* Seller */}
            <div className="relative">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black">فروشنده</div>
              <div className="border border-slate-300 rounded-xl p-5 h-full bg-slate-50/50 print:bg-white print:border-black">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-4 bg-slate-900 rounded-full print:bg-black"></div>
                   <h3 className="font-bold text-slate-800 print:text-black">خانه طلا ایران</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 print:text-black">
                   <div className="col-span-2 flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0"/>
                      <span>تهران، میدان ونک، خیابان ملاصدرا، پلاک ۱</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span className="font-mono" dir="ltr">021-88888888</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Hash size={14} />
                      <span className="font-mono">411122223333</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Globe size={14} />
                      <span className="font-mono">irangoldhouse.com</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="relative">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black">خریدار</div>
              <div className="border border-slate-300 rounded-xl p-5 h-full print:border-black">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-4 bg-emerald-500 rounded-full print:bg-black"></div>
                   <h3 className="font-bold text-slate-800 print:text-black">{data.customer?.name}</h3>
                   <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 print:bg-transparent print:border print:border-slate-300 print:text-black">{data.customer?.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 print:text-black">
                   <div className="col-span-2 flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0"/>
                      <span>{data.customer?.address || `${data.customer?.city || '-'}، ${data.customer?.province || '-'}`}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span className="font-mono" dir="ltr">{data.customer?.phone}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Hash size={14} />
                      <span className="font-mono">کد ملی/اقتصادی: {data.customer?.nationalId || data.customer?.economicCode || '-'}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span className="font-mono">{data.customer?.postalCode ? `کد پستی: ${data.customer.postalCode}` : '-'}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- ITEMS TABLE --- */}
          <div className="mb-6">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white print-header-simple">
                  <th className="py-3 px-4 text-center rounded-tr-lg w-12 print:rounded-none">#</th>
                  <th className="py-3 px-4 text-right">شرح کالا / خدمات</th>
                  <th className="py-3 px-4 text-center w-32">شماره سریال</th>
                  <th className="py-3 px-4 text-center w-20">عیار</th>
                  <th className="py-3 px-4 text-center w-20">وزن (g)</th>
                  <th className="py-3 px-4 text-left w-32">فی (ریال)</th>
                  <th className="py-3 px-4 text-left rounded-tl-lg w-40 print:rounded-none">مبلغ کل (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200 print:border-black">
                {data.items.map((item) => (
                  <tr key={item.row} className="print:break-inside-avoid hover:bg-slate-50 print-row-stripe">
                    <td className="py-3 px-4 text-center font-medium text-slate-500 print:text-black">{formatNumber(item.row)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 print:text-black">{item.desc}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 print:text-black" dir="ltr">{item.serial || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 print:text-black">{formatNumber(item.purity)}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600 bg-slate-50 print:bg-transparent print:text-black">{formatNumber(item.weight)}</td>
                    <td className="py-3 px-4 text-left font-mono text-slate-600 print:text-black">{formatCurrency(item.price)}</td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-slate-900 bg-slate-50 print:bg-transparent print:text-black">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- FOOTER --- */}
          <div className="flex gap-8 items-stretch">
             
             {/* Left: Terms & Signatures */}
             <div className="flex-1 flex flex-col justify-between">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 print:bg-white print:border-black">
                   <h4 className="font-bold text-xs text-slate-800 mb-2 print:text-black">شرایط و ضوابط</h4>
                   <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside marker:text-slate-400 print:text-black">
                      <li>کالای فروخته شده با ارائه اصل فاکتور و سالم بودن پک، طبق تعرفه روز قابل بازخرید است.</li>
                      <li>مسئولیت نگهداری از کالا و جلوگیری از مخدوش شدن بسته‌بندی بر عهده خریدار است.</li>
                      <li>ارزش افزوده بر اساس سود و اجرت ساخت محاسبه شده است.</li>
                   </ul>
                </div>

                <div className="flex gap-8 mt-6">
                   <div className="flex-1 text-center">
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center mb-2 print:border-black print:border-solid">
                         <span className="text-[10px] text-slate-400 print:hidden">مهر و امضای خریدار</span>
                         <span className="text-[10px] text-black hidden print:block pt-16">مهر و امضای خریدار</span>
                      </div>
                   </div>
                   <div className="flex-1 text-center">
                      <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center mb-2 relative print:border-black print:border-solid">
                         {/* Stamp Simulation */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-10 print:opacity-100">
                            <div className="w-16 h-16 border-2 border-blue-900 rounded-full flex items-center justify-center rotate-[-15deg] print:border-black">
                               <span className="text-[8px] font-bold text-blue-900 print:text-black">خانه طلا ایران</span>
                            </div>
                         </div>
                         <span className="text-[10px] text-slate-400 relative z-10 print:hidden">مهر و امضای فروشنده</span>
                         <span className="text-[10px] text-black hidden print:block relative z-10 pt-16">مهر و امضای فروشنده</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right: Totals */}
             <div className="w-80 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600 py-1 print:text-black">
                   <span>جمع کل اقلام</span>
                   <span className="font-mono font-medium">{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 py-1 print:text-black">
                   <span>تخفیف</span>
                   <span className="font-mono font-medium">{formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 py-1 border-b border-slate-200 pb-2 print:border-black print:text-black">
                   <span>مالیات بر ارزش افزوده</span>
                   <span className="font-mono font-medium">{formatCurrency(tax)}</span>
                </div>
                
                <div className="bg-slate-900 text-white rounded-xl p-4 shadow-lg print-box-border">
                   <div className="flex justify-between items-end">
                      <span className="text-xs opacity-80 print:text-black">مبلغ قابل پرداخت</span>
                      <div className="text-right">
                         <span className="text-2xl font-bold font-mono tracking-tight print:text-black">{formatCurrency(finalTotal)}</span>
                         <span className="text-[10px] opacity-60 block mt-0.5 print:text-black">ریال</span>
                      </div>
                   </div>
                </div>
                <div className="text-center">
                   <p className="text-[9px] text-slate-400 print:text-black">از اعتماد شما سپاسگزاریم</p>
                </div>
             </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
