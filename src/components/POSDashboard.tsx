import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, X, Trash2, CreditCard, Banknote, Smartphone, Receipt, CheckCircle, Search, Printer, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Product, POSOrder } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface POSDashboardProps {
  products: Product[];
  onCheckout: (data: any) => Promise<POSOrder | null>;
}

export function POSDashboard({ products, onCheckout }: POSDashboardProps) {
  const { t, language } = useLanguage();
  const [cart, setCart] = useState<{ [id: number]: { product: Product; quantity: number } }>({});
  const [selectedCustomer, setSelectedCustomer] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'bank'>('cash');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState<POSOrder | null>(null);
  const [showPrinterOptions, setShowPrinterOptions] = useState(false);
  const [printerOptions, setPrinterOptions] = useState({
    paperWidth: '80mm', // '80mm' | '58mm' | 'standard'
    fontFamily: 'Courier New', // 'Courier New' | 'monospace' | 'sans-serif'
    feedLines: 3,
    highContrast: true,
    printBorders: true,
    showBarcode: true,
  });

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
    p.stock > 0
  );

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0), [cartItems]);
  const taxAmount = useMemo(() => Math.round(cartTotal * 0.08), [cartTotal]);
  const grandTotal = useMemo(() => cartTotal + taxAmount, [cartTotal, taxAmount]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev[product.id];
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return {
          ...prev,
          [product.id]: { ...existing, quantity: existing.quantity + 1 }
        };
      }
      return {
        ...prev,
        [product.id]: { product, quantity: 1 }
      };
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      if (newQty > existing.product.stock) return prev;
      return {
        ...prev,
        [id]: { ...existing, quantity: newQty }
      };
    });
  };

  const clearCart = () => setCart({});

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    try {
      const orderData = {
        totalAmount: grandTotal,
        paymentMethod: paymentMethod === 'bank' ? 'mobile' : paymentMethod,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          totalPrice: item.product.price * item.quantity
        }))
      };
      const order = await onCheckout(orderData);
      if (order) {
        setLastOrder(order);
        setCart({});
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintDocument = async (
    type: 'receipt' | 'cash-sale' | 'invoice' | 'bill',
    order: POSOrder | null = null
  ) => {
    const targetItems = order 
      ? order.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          total: item.totalPrice
        }))
      : cartItems.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity
        }));

    if (targetItems.length === 0) {
      alert("Cart is empty! Add items to print.");
      return;
    }

    const customer = order ? 'Walk-in Customer' : selectedCustomer;
    const methodDisplay = order 
      ? (order.paymentMethod === 'mobile' ? 'M-Pesa' : order.paymentMethod === 'card' ? 'Card' : 'Cash')
      : (paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'card' ? 'Card' : paymentMethod === 'mobile' ? 'M-Pesa' : 'Bank Transfer');

    const subtotal = targetItems.reduce((sum, c) => sum + c.total, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const now = order ? new Date(order.createdAt) : new Date();
    const dateStr = now.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    
    const invoiceNo = order?.orderNumber || 'BS-EST' + Math.floor(100000 + Math.random() * 900000);
    
    const docTypeMap = {
      'receipt': 'RECEIPT',
      'cash-sale': 'CASH SALE',
      'invoice': 'INVOICE',
      'bill': 'BILL'
    };
    const docTitle = docTypeMap[type] || 'RECEIPT';

    // Formulate a verification URL pointing back to the app with rich purchase verification query parameters.
    const verifyUrl = `${window.location.origin}/?verify=true&invoice=${invoiceNo}&customer=${encodeURIComponent(customer)}&total=${(total / 100).toFixed(2)}&date=${encodeURIComponent(dateStr)}&payment=${encodeURIComponent(methodDisplay)}`;

    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 });
    } catch (err) {
      console.error('Failed to generate verification QR code:', err);
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      
      let rowsHtml = '';
      targetItems.forEach((c, i) => {
        rowsHtml += `
          <tr>
            <td>${i + 1}</td>
            <td>${c.name}</td>
            <td>${c.quantity}</td>
            <td>KSh ${(c.price / 100).toFixed(2)}</td>
            <td>KSh ${(c.total / 100).toFixed(2)}</td>
          </tr>
        `;
      });

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docTitle} ${invoiceNo}</title>
          <style>
            body {
              font-family: 'Arial Black', 'Arial', sans-serif;
              font-size: 11px;
              color: #000;
              padding: 20px;
              background: #fff;
              margin: 0;
            }
            .print-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .print-header h2 {
              font-size: 18px;
              margin: 0;
            }
            .print-header p {
              margin: 2px 0;
              font-size: 11px;
              color: #333;
            }
            .print-doc-type {
              text-align: center;
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 6px 0 10px;
            }
            .print-meta {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin: 4px 0 8px;
              color: #444;
            }
            .print-customer {
              font-size: 11px;
              margin: 4px 0 8px;
              padding: 6px 8px;
              background: #f9f9f9;
              border: 1px solid #eee;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            table th, table td {
              border: 1px solid #ccc;
              padding: 4px 6px;
              text-align: left;
              font-size: 11px;
            }
            table th {
              background: #f1f1f1;
              font-weight: 600;
            }
            .print-totals {
              text-align: right;
              margin-top: 8px;
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }
            .print-totals .row {
              display: flex;
              justify-content: flex-end;
              gap: 30px;
              padding: 2px 0;
            }
            .print-totals .row.total {
              font-weight: 700;
              font-size: 14px;
            }
            .print-footer {
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 13px;
              margin-top: 13px;
            }
            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h2>🏪 Biashara Sasa</h2>
            <p>123 Moi Avenue, Nairobi · +254 700 123 456</p>
            <p style="font-size:10px;">${dateStr} · ${timeStr}</p>
          </div>
          <div class="print-doc-type">${docTitle}</div>
          <div class="print-meta">
            <span><strong>Invoice:</strong> ${invoiceNo}</span>
            <span><strong>Date:</strong> ${dateStr}</span>
          </div>
          <div class="print-customer">
            <strong>Customer:</strong> ${customer} &nbsp;|&nbsp; <strong>Payment:</strong> ${methodDisplay}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="print-totals">
            <div class="row"><span>Subtotal:</span> &nbsp; <span>KSh ${(subtotal / 100).toFixed(2)}</span></div>
            <div class="row"><span>Tax (8%):</span> &nbsp; <span>KSh ${(tax / 100).toFixed(2)}</span></div>
            <div class="row total"><span>TOTAL:</span> &nbsp; <span>KSh ${(total / 100).toFixed(2)}</span></div>
          </div>
          
          <!-- Verification QR Code Block -->
          ${qrCodeDataUrl ? `
          <div style="text-align: center; margin: 18px 0 10px 0; border-top: 1px dashed #ccc; padding-top: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="${qrCodeDataUrl}" style="width: 105px; height: 105px; border: 1px solid #ddd; padding: 4px; border-radius: 6px; display: inline-block;" alt="Verification QR Code" />
            <div style="font-size: 8px; font-weight: bold; color: #006837; margin-top: 6px; letter-spacing: 0.5px;">✓ OFFICIAL VERIFIED MERCHANDISE</div>
            <div style="font-size: 7px; color: #888; margin-top: 2px; font-family: monospace;">Scan code to verify authenticity</div>
          </div>
          ` : ''}

          <div class="print-footer">
            ${docTitle} · ${invoiceNo} · ${dateStr} ${timeStr}<br/>
            Thank you for your business!
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
        </html>
      `;
      doc.write(printHTML);
      doc.close();

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="xl:col-span-1 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold flex items-center gap-2.5 text-brand-dark">
            <Receipt className="w-6 h-6 text-brand-green" /> {t.pos.title}
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t.pos.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green outline-none shadow-sm transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowPrinterOptions(prev => !prev)}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 font-bold text-xs cursor-pointer ${
                showPrinterOptions 
                  ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
              }`}
              title="Configure Thermal Receipt Printer Mode"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Printer Settings</span>
            </button>
          </div>
        </div>

        {showPrinterOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[24px] p-6 border border-slate-200/80 shadow-md space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-green" />
                <h3 className="font-bold text-brand-dark text-sm">Thermal Printer Interface Setup</h3>
              </div>
              <span className="bg-brand-green/10 text-brand-green px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                Active Print Profile
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Controls Column */}
              <div className="space-y-4">
                {/* Paper width */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Receipt Paper Width
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '80mm', label: '80mm Roll', desc: 'Desktop POS' },
                      { id: '58mm', label: '58mm Roll', desc: 'Mobile POS' },
                      { id: 'standard', label: 'Standard', desc: 'Letter / A4' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrinterOptions(prev => ({ ...prev, paperWidth: opt.id }))}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          printerOptions.paperWidth === opt.id
                            ? 'bg-brand-green/5 border-brand-green text-brand-green'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="font-black text-xs">{opt.id.toUpperCase()}</span>
                        <span className="text-[8px] mt-0.5 font-medium leading-tight text-slate-400">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family Selection */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                    Printer Typographic Font
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Courier New', label: 'Classic Courier' },
                      { id: 'monospace', label: 'System Mono' },
                      { id: 'sans-serif', label: 'Modern Sans' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrinterOptions(prev => ({ ...prev, fontFamily: opt.id }))}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          printerOptions.fontFamily === opt.id
                            ? 'bg-brand-green/5 border-brand-green text-brand-green'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        <span className="font-bold text-[10px] block truncate" style={{ fontFamily: opt.id === 'Courier New' ? 'Courier' : opt.id }}>
                          Aa Bb
                        </span>
                        <span className="text-[8px] font-medium text-slate-400 block truncate">
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Feed Tear Margins
                    </span>
                    <select
                      value={printerOptions.feedLines}
                      onChange={(e) => setPrinterOptions(prev => ({ ...prev, feedLines: parseInt(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-2 text-xs font-bold text-slate-700 outline-none"
                    >
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n} blank lines</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Barcodes
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={printerOptions.showBarcode}
                        onChange={(e) => setPrinterOptions(prev => ({ ...prev, showBarcode: e.target.checked }))}
                        className="rounded text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-600">Print Barcode</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerOptions.highContrast}
                      onChange={(e) => setPrinterOptions(prev => ({ ...prev, highContrast: e.target.checked }))}
                      className="rounded text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-700 block">Monochrome</span>
                      <span className="text-[9px] text-slate-400 block">Pure B&W contrast</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerOptions.printBorders}
                      onChange={(e) => setPrinterOptions(prev => ({ ...prev, printBorders: e.target.checked }))}
                      className="rounded text-brand-green focus:ring-brand-green accent-brand-green cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-700 block">Tear Line Guide</span>
                      <span className="text-[9px] text-slate-400 block">Visual scissor line</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Simulated Paper Preview Column */}
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">
                  Live Paper slip Simulation
                </span>
                
                {/* Simulated Roll */}
                <div 
                  className="bg-white shadow-sm border border-slate-200/60 p-4 relative overflow-hidden transition-all duration-300 rounded-sm"
                  style={{
                    width: printerOptions.paperWidth === '58mm' ? '170px' : 
                           printerOptions.paperWidth === '80mm' ? '220px' : '95%',
                    fontFamily: printerOptions.fontFamily === 'Courier New' ? 'Courier, monospace' : 
                                printerOptions.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 'monospace',
                    color: printerOptions.highContrast ? '#000000' : '#475569',
                    fontSize: '10px',
                    lineHeight: '1.4'
                  }}
                >
                  <div className="text-center font-bold mb-2">
                    <div className="text-[11px] font-black tracking-wide uppercase">TRADER POS</div>
                    <div className="text-[8px] font-medium uppercase tracking-widest text-slate-400">Management System</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">20/06/2026, 11:58 PM</div>
                  </div>

                  <div className="flex justify-between text-[8px] font-semibold border-b border-dashed border-slate-300 pb-1.5 mb-1.5">
                    <span>RCPT: #TRAD-3746</span>
                    <span>CASH</span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span>2x Kenyan Tea Roll</span>
                      <span className="font-bold">$4.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Biashara Coffee</span>
                      <span className="font-bold">$3.00</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-300 pt-1.5 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold">
                      <span>TOTAL PAID:</span>
                      <span className="text-brand-green font-black">$7.50</span>
                    </div>
                  </div>

                  {printerOptions.showBarcode && (
                    <div className="flex flex-col items-center mt-3 pt-1">
                      <div className="flex items-end justify-center h-5 gap-[1px] w-4/5 overflow-hidden">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              width: idx % 4 === 0 ? '2px' : '1px', 
                              height: idx % 5 === 0 ? '12px' : '20px', 
                              backgroundColor: '#000' 
                            }} 
                          />
                        ))}
                      </div>
                      <div className="text-[7px] font-bold text-center mt-0.5 tracking-wider font-mono">*TRAD-3746*</div>
                    </div>
                  )}

                  {printerOptions.printBorders && (
                    <div className="text-center text-[7px] text-slate-400 font-bold border-t border-dashed border-slate-300 pt-1.5 mt-2.5">
                      ✂ ----------------- ✂
                    </div>
                  )}

                  {Array.from({ length: printerOptions.feedLines }).map((_, idx) => (
                    <div key={idx} className="h-2 text-center text-slate-300 text-[6px] font-bold leading-none mt-0.5">• empty lines •</div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredProducts.map(product => (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-green/30 transition-all text-left flex flex-col group h-full active:scale-95"
              >
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{product.sku}</span>
                  <h4 className="font-bold text-brand-dark text-base line-clamp-1 group-hover:text-brand-green transition-colors">{product.name}</h4>
                </div>
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Price</span>
                    <span className="text-base font-black text-brand-green">KSh {(product.price / 100).toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase py-1 px-2.5 bg-slate-50 border border-slate-100 rounded-full text-slate-500">{product.stock} {t.pos.inStock}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-brand-dark rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[750px] xl:h-[calc(95vh-90px)] sticky top-6">
            <div className="p-6 bg-white/5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-blue" /> {t.pos.currentOrder}
              </h3>
              <button 
                onClick={clearCart}
                className="text-white/40 hover:text-white/80 transition-colors"
                title={t.pos.clearCart}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Document Actions */}
            <div className="p-5 bg-white/5 border-b border-white/10 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-white/40 tracking-widest mb-1.5">
                  Customer Profile
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-brand-green/50 transition-colors"
                >
                  <option value="Walk-in Customer">Walk-in Customer</option>
                  <option value="John Doe (Regular)">John Doe (Regular)</option>
                  <option value="Jane Smith (SME)">Jane Smith (SME)</option>
                  <option value="Biashara Express (VIP)">Biashara Express (VIP)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-white/40 tracking-widest mb-1.5">
                  Print Active Order Draft
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => handlePrintDocument('receipt')}
                    className="py-1.5 px-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    title="Print Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5 text-brand-blue" />
                    Receipt
                  </button>
                  <button
                    onClick={() => handlePrintDocument('cash-sale')}
                    className="py-1.5 px-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    title="Print Cash-Sale"
                  >
                    <Banknote className="w-3.5 h-3.5 text-brand-green" />
                    Cash-Sale
                  </button>
                  <button
                    onClick={() => handlePrintDocument('invoice')}
                    className="py-1.5 px-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    title="Print Invoice"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Invoice
                  </button>
                  <button
                    onClick={() => handlePrintDocument('bill')}
                    className="py-1.5 px-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    title="Print Bill"
                  >
                    <Printer className="w-3.5 h-3.5 text-rose-400" />
                    Bill
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/30 space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium">{t.pos.emptyCart}.<br/>Select products to sell.</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.product.id} className="bg-white/10 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-white font-bold text-sm leading-tight">{item.product.name}</span>
                      <span className="text-brand-blue font-black text-sm">KSh {((item.product.price * item.quantity) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                        >
                           <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white font-black text-sm w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                        >
                           <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => updateQuantity(item.product.id, -item.quantity)}
                        className="text-red-400/60 hover:text-red-400 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white/10 border-t border-white/20 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold">
                  <span>{t.pos.subtotal}</span>
                  <span>KSh {(cartTotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-white/50 text-xs font-bold">
                  <span>VAT Tax (8%)</span>
                  <span>KSh {(taxAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-white text-2xl font-black pt-1 border-t border-white/5">
                  <span>{t.pos.total}</span>
                  <span className="text-brand-blue">KSh {(grandTotal / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase text-white/40 tracking-widest block">{t.pos.paymentMethod}</label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[9px] font-bold transition-all ${paymentMethod === 'cash' ? 'bg-brand-blue text-brand-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Banknote className="w-3.5 h-3.5" /> Cash
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[9px] font-bold transition-all ${paymentMethod === 'card' ? 'bg-brand-blue text-brand-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('mobile')}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[9px] font-bold transition-all ${paymentMethod === 'mobile' ? 'bg-brand-blue text-brand-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> M-Pesa
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('bank')}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[9px] font-bold transition-all ${paymentMethod === 'bank' ? 'bg-brand-blue text-brand-dark' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    <Printer className="w-3.5 h-3.5" /> Bank
                  </button>
                </div>
              </div>

              <button 
                disabled={cartItems.length === 0 || isProcessing}
                onClick={handleCheckout}
                className="w-full py-3.5 bg-brand-green text-white rounded-2xl font-black shadow-xl shadow-brand-green/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2.5 text-sm"
              >
                {isProcessing ? (
                  <>{t.pos.processing}</>
                ) : (
                  <><CheckCircle className="w-4.5 h-4.5" /> Complete Sale & Checkout</>
                )}
              </button>
            </div>
          </div>
        </div>

      <AnimatePresence>
        {lastOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="bg-brand-dark p-6 text-center text-white space-y-2">
                <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center text-white mx-auto mb-2">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">{t.pos.saleSuccessful}</h3>
                <p className="text-white/60 text-sm">{lastOrder.orderNumber}</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4 border-b border-slate-100 pb-6 text-sm">
                  {lastOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">
                        <strong className="text-slate-900 mr-1">{item.quantity}x</strong> {item.productName}
                      </span>
                      <span className="font-bold text-slate-700">KSh {(item.totalPrice / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                    <span>{t.pos.paymentMethod}</span>
                    <span className="capitalize">{lastOrder.paymentMethod === 'mobile' ? 'M-Pesa' : lastOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-900 font-bold">{t.pos.totalPaid}</span>
                    <span className="text-2xl font-black text-brand-green">KSh {(lastOrder.totalAmount / 100).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-widest text-center">
                    Print Formats
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => handlePrintDocument('receipt', lastOrder)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Receipt className="w-3.5 h-3.5 text-brand-blue" />
                      Receipt
                    </button>
                    <button
                      onClick={() => handlePrintDocument('cash-sale', lastOrder)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Banknote className="w-3.5 h-3.5 text-brand-green" />
                      Cash-Sale
                    </button>
                    <button
                      onClick={() => handlePrintDocument('invoice', lastOrder)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      Invoice
                    </button>
                    <button
                      onClick={() => handlePrintDocument('bill', lastOrder)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 text-rose-500" />
                      Bill
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setLastOrder(null)}
                    className="w-full py-3 bg-brand-green text-white rounded-xl font-bold text-xs"
                  >
                    {t.pos.newOrder}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
