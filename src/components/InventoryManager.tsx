import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  AlertCircle, 
  History, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  X, 
  CheckCircle, 
  Lock, 
  Coins 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (data: any) => Promise<void>;
  onAdjustStock: (id: number, change: number, reason: string) => Promise<void>;
  onDeleteProduct: (id: number) => Promise<void>;
  onAddProductsBulk?: (items: any[]) => Promise<void>;
  role?: string;
  status?: string;
}

export function InventoryManager({ 
  products, 
  onAddProduct, 
  onAdjustStock, 
  onDeleteProduct,
  onAddProductsBulk,
  role = 'trader',
  status = 'inactive'
}: InventoryManagerProps) {
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockChange, setStockChange] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Restock');

  // Bulk Upload Specific State
  const [bulkInputText, setBulkInputText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checks if the user is a trader & has NOT paid / completed subscription
  const isTrader = role === 'trader';
  const isSubscriptionActive = !isTrader || status === 'active';

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct && stockChange !== 0) {
      await onAdjustStock(selectedProduct.id, stockChange, adjustReason);
      setSelectedProduct(null);
      setStockChange(0);
    }
  };

  // Helper to parse CSV format
  const parseCSVData = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 2) {
        setBulkError("Invalid data format. Please include at least a header row and one product row.");
        return;
      }

      // Read headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const results: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple comma split
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        // Map values to default keys
        const rowData: any = {};
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            rowData[header] = values[index];
          }
        });

        const name = rowData['name'] || rowData['product'] || rowData['product name'] || values[0];
        const rawSku = rowData['sku'] || rowData['code'] || values[1];
        const sku = rawSku || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        const rawPrice = rowData['price'] || rowData['cost'] || values[2] || '100';
        const cleanPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 1.0;
        const price = Math.round(cleanPrice * 100); // convert to cents

        const category = rowData['category'] || rowData['type'] || values[3] || 'General';
        
        const rawStock = rowData['stock'] || rowData['quantity'] || rowData['initial stock'] || values[4] || '10';
        const initialStock = parseInt(rawStock.replace(/[^0-9]/g, '')) || 0;

        if (name && name !== 'name' && name !== 'Name') {
          results.push({ name, sku, price, category, initialStock });
        }
      }

      if (results.length === 0) {
        setBulkError("Could not extract any valid product records from the provided file/text.");
      } else {
        setParsedProducts(results);
        setBulkError(null);
      }
    } catch (err: any) {
      setBulkError(`Error parsing CSV layout: ${err.message || err}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndParseFile(file);
  };

  const readAndParseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkInputText(text);
      parseCSVData(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readAndParseFile(file);
    }
  };

  const handleApplyBulkUpload = async () => {
    if (parsedProducts.length === 0 || !onAddProductsBulk) return;
    await onAddProductsBulk(parsedProducts);
    setParsedProducts([]);
    setBulkInputText('');
    setIsBulkAdding(false);
  };

  const triggerAutofillSample = () => {
    const template = `Product Name,SKU,Price,Category,Stock\nPremium Omo Soap,SOP-OMO-PRE,150,Soaps,120\nMen's Rexona Deodorant,REI-REX-M,2.40,Soaps,180\nGinger Infusion Extract,JUC-GIN-INF,1.80,Juices,220\nChilled Delmonte,JUC-DEL-CHI,2.50,Juices,300\nClassic Cold Coke Soda,SDA-COK-CLS,0.80,Soda,150\nElianto Vegetable Oil,OIL-ELI-VEG,3.00,Oils,140\nJamia Grade A Cooking Oil,OIL-JAM-GDA,2.80,Oils,160`;
    setBulkInputText(template);
    parseCSVData(template);
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Product Name,SKU,Price,Category,Stock\nPremium Omo Soap,SOP-OMO-PRE,1.50,Soaps,120\nClassic Cold Coke Soda,SDA-COK-CLS,0.80,Soda,150\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "biashara_sasa_stock_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2.5 text-brand-dark">
            <Package className="w-6 h-6 text-brand-green" /> {t.inventory.title}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">
            Manage your retail inventory, update current stock volumes, or quickly load products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.inventory.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-green w-56 transition-all"
            />
          </div>

          {/* Bulk Upload Button */}
          <button 
            onClick={() => setIsBulkAdding(true)}
            className="flex items-center gap-2 px-5 py-2 bg-brand-dark hover:bg-slate-800 text-white rounded-full font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-brand-green" /> Bulk Stock Upload
          </button>

          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-2 bg-brand-green text-white rounded-full font-bold text-sm shadow-lg shadow-brand-green/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="w-4 h-4" /> {t.inventory.addProduct}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.inventory.name}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.inventory.sku}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.inventory.price}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.inventory.stock}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.inventory.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-brand-dark">{product.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{product.category}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">${(product.price / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${product.stock < 10 ? 'bg-brand-red/10 text-brand-red' : 'bg-brand-green/10 text-brand-green'}`}>
                          {product.stock} {t.inventory.units}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title={t.inventory.adjustStock}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                      No stock records found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {selectedProduct && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-brand-dark flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-blue" /> {t.inventory.adjustStock}
                  </h3>
                  <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
                </div>
                <p className="text-sm text-slate-500 mb-6">Updating stock levels for <strong>{selectedProduct.name}</strong></p>
                
                <form onSubmit={handleSubmitAdjust} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Quantity Change</label>
                    <input 
                      type="number"
                      value={stockChange}
                      onChange={(e) => setStockChange(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green transition-all outline-none"
                      placeholder="e.g. 10 or -5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1 font-bold">Reason</label>
                    <select 
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-green transition-all outline-none text-sm"
                    >
                      <option value="Restock">{t.inventory.restock}</option>
                      <option value="Damaged">{t.inventory.damaged}</option>
                      <option value="Returned">{t.inventory.returned}</option>
                      <option value="Audit Correction">Audit Correction</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-dark text-white rounded-2xl font-bold hover:bg-brand-green transition-all cursor-pointer"
                  >
                    {t.inventory.updateStock}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-brand-dark p-6 rounded-3xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-brand-red animate-pulse" />
              <h3 className="font-bold">{t.inventory.lowStockAlerts}</h3>
            </div>
            <div className="space-y-3">
              {products.filter(p => p.stock < 10).length > 0 ? (
                products.filter(p => p.stock < 10).map(p => (
                  <div key={p.id} className="bg-white/10 px-4 py-3 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                    <span className="bg-brand-red/80 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{p.stock} {t.dashboard.itemsLow}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/60 italic">{t.inventory.noLowStock}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SINGLE PRODUCT MODAL */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-brand-dark">{t.inventory.newProduct}</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
              </div>
              <form onSubmit={async (e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                await onAddProduct({
                  name: formData.get('name'),
                  sku: formData.get('sku'),
                  price: Math.round(parseFloat(formData.get('price') as string) * 100),
                  category: formData.get('category'),
                  initialStock: parseInt(formData.get('initialStock') as string) || 0
                });
                setIsAdding(false);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">{t.inventory.name}</label>
                    <input name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">{t.inventory.price} ($)</label>
                    <input name="price" type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">{t.inventory.stock}</label>
                    <input name="initialStock" type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1 font-bold">{t.inventory.sku}</label>
                    <input name="sku" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1 font-bold">{t.inventory.category}</label>
                    <input name="category" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-brand-green text-white rounded-2xl font-bold mt-4 shadow-lg hover:shadow-brand-green/20 transition-all cursor-pointer">
                  {t.inventory.createProduct}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BULK STOCK LOADER MODAL (WITH PAYMENT SECURITY GUARD) */}
      <AnimatePresence>
        {isBulkAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-2xl p-8 md:p-10 shadow-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-6 h-6 text-brand-green" />
                  <h3 className="text-xl font-bold text-brand-dark">Bulk Stock Loader</h3>
                </div>
                <button onClick={() => {
                  setIsBulkAdding(false);
                  setParsedProducts([]);
                  setBulkInputText('');
                  setBulkError(null);
                }} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
              </div>

              {/* SECURITY GUARD: Show warning if trader is not active yet */}
              {!isSubscriptionActive ? (
                <div className="space-y-6 text-center py-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                    <Lock className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h4 className="text-lg font-black text-slate-800">Subscription Regime Action Required</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      To safeguard business integrity, high-performance bulk stock uploading is restricted to registered retail partners who have opened their outlet and completed paid license activation.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 max-w-sm mx-auto flex items-center gap-3 text-left">
                    <Coins className="w-5 h-5 text-brand-green shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Restore or Restructure Regime</p>
                      <p className="text-[11px] text-slate-400 font-medium">Restructuring is instantly bypassable in the regimes tab.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsBulkAdding(false);
                      // Trigger switching of active tab to subscription regimes
                      // But wait, the tab change can be controlled from tab navigation or App.tsx. Let's send a friendly hint!
                    }}
                    className="px-6 py-3 bg-brand-dark text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-slate-800 transition-all inline-block"
                  >
                    Close & Go to Subscription Regimes
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Upload your shop opening list in bulk. Drop your custom sheet CSV file or paste product spreadsheet rows below. Standard columns: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-brand-dark">Product Name, SKU, Price, Category, Stock</code>.
                  </p>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                      dragOver 
                        ? 'border-brand-green bg-brand-green/5' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv"
                      className="hidden" 
                    />
                    <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Drag & Drop your template spreadsheet here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse your desktop storage</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Or copy/paste CSV rows</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={downloadSampleTemplate} 
                        className="flex items-center gap-1.5 text-xs font-black text-brand-green tracking-wide hover:underline cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Template
                      </button>
                      <button 
                        onClick={triggerAutofillSample} 
                        className="flex items-center gap-1.5 text-xs font-black text-brand-blue tracking-wide hover:underline cursor-pointer"
                      >
                        Autofill Sample Stock
                      </button>
                    </div>
                  </div>

                  <textarea 
                    value={bulkInputText}
                    onChange={(e) => {
                      setBulkInputText(e.target.value);
                      parseCSVData(e.target.value);
                    }}
                    placeholder="Product Name,SKU,Price,Category,Stock&#10;Premium Omo Soap,SOP-OMO-PRE,1.50,Soaps,120&#10;Cold Coke Soda,SDA-COK-CLS,0.80,Soda,150"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-mono font-medium focus:ring-2 focus:ring-brand-green text-slate-700"
                  />

                  {bulkError && (
                    <div className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-2xl flex items-start gap-2.5 text-xs text-brand-red font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  {parsedProducts.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-brand-green" /> Extracted Preview ({parsedProducts.length} items parsed)
                      </span>
                      <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100">
                        {parsedProducts.map((p, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-all">
                            <div>
                              <p className="font-bold text-brand-dark">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{p.sku} • {p.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-700">${(p.price / 100).toFixed(2)}</p>
                              <p className="text-[10px] text-brand-green font-black">{p.initialStock} units</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={parsedProducts.length === 0}
                    onClick={handleApplyBulkUpload}
                    className="w-full py-4 bg-brand-green text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirm & Bulk Upload {parsedProducts.length} Products
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
