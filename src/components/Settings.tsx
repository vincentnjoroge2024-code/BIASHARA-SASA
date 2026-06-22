import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Languages, 
  Mail, 
  Lock, 
  Search, 
  UserCog, 
  Briefcase, 
  AlertCircle,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Database,
  Download,
  Upload,
  FileText,
  Sparkles,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';

interface SettingsProps {
  profile: UserProfile | null;
  getToken: () => Promise<string | null>;
  products?: Product[];
  onSyncComplete?: () => void;
}

interface UserRecord {
  id: number;
  uid: string;
  email: string;
  role: 'back-office' | 'trader';
  traderId: number | null;
  createdAt: string;
}

export function Settings({ profile, getToken, products, onSyncComplete }: SettingsProps) {
  const { t, language, setLanguage } = useLanguage();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccessCode, setUserSuccessCode] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Interoperability Hub state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportProductsCSV = () => {
    if (!products || products.length === 0) return;
    
    // Header
    let csvContent = "ID,Product Name,SKU,Price (KSh),Current Stock,Category\n";
    
    // Rows
    products.forEach(p => {
      const priceFormatted = (p.price / 100).toFixed(2);
      const nameEscaped = p.name.replace(/"/g, '""');
      csvContent += `${p.id},"${nameEscaped}",${p.sku},${priceFormatted},${p.stock},"${p.category}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `biashara_sasa_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportProductsJSON = () => {
    if (!products || products.length === 0) return;
    const embedded = products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
      category: p.category
    }));
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(embedded, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `biashara_sasa_products_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncLoading(true);
    setSyncStatus({ type: 'info', message: 'Reading offline transactions ledger...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.orders || !Array.isArray(parsed.orders)) {
          throw new Error('Ledger format issue. Expected root object with an "orders" array elements.');
        }

        const token = await getToken();
        setSyncStatus({ type: 'info', message: `Syncing ${parsed.orders.length} transactions with cloud store...` });

        const res = await fetch('/api/pos/orders/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ orders: parsed.orders })
        });

        if (!res.ok) {
          const errMsg = await res.text();
          throw new Error(errMsg || 'Failed to sync offline sales queue.');
        }

        const report = await res.json();
        const successCount = report.details ? report.details.filter((d: any) => d.success).length : 0;
        
        setSyncStatus({
          type: 'success',
          message: `Integrated ${successCount} transactions successfully! Dynamic levels restored.`
        });

        if (onSyncComplete) {
          onSyncComplete();
        }
      } catch (err: any) {
        setSyncStatus({
          type: 'error',
          message: err.message || 'Verification failure'
        });
      } finally {
        setSyncLoading(false);
        if (e.target) {
          e.target.value = ''; // Reset input
        }
      }
    };
    
    reader.onerror = () => {
      setSyncStatus({ type: 'error', message: 'File read failed.' });
      setSyncLoading(false);
    };

    reader.readAsText(file);
  };

  const downloadOfflinePOSClient = () => {
    const embeddedProducts = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price, // in cents (e.g., 12000 for 120.00 KSh)
      category: p.category
    }));

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Biashara Sasa · Interoperable Offline POS Terminal</title>
  <style>
    :root {
      --brand-green: #0fa24e;
      --brand-dark: #001f14;
      --brand-blue: #0a6cbe;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--slate-50); color: var(--slate-900); padding: 20px; min-height: 100vh; }
    header { background-color: var(--brand-dark); color: white; padding: 20px 30px; border-radius: 24px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(15, 162, 78, 0.2); }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
    .badge { background-color: var(--brand-green); color: white; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-offline { background-color: #f32230; }
    
    .container { display: grid; grid-template-columns: 1fr 400px; gap: 24px; max-width: 1400px; margin: 0 auto; }
    @media (max-width: 900px) { .container { grid-template-columns: 1fr; } }
    
    .card { background: white; border-radius: 24px; padding: 24px; border: 1px solid var(--slate-100); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .search-box { width: 100%; padding: 12px 16px; border: 1px solid var(--slate-200); border-radius: 12px; font-size: 14px; outline: none; margin-bottom: 20px; transition: all 0.2s; font-weight: 600; }
    .search-box:focus { border-color: var(--brand-green); box-shadow: 0 0 0 3px rgba(15, 162, 78, 0.15); }
    
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .product-card { background: var(--slate-50); border: 1px solid var(--slate-100); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; height: 160px; cursor: pointer; transition: all 0.2s; position: relative; }
    .product-card:hover { border-color: var(--brand-green); transform: translateY(-2px); box-shadow: 0 8px 16px -4px rgba(15,162,78,0.05); }
    .product-category { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--brand-blue); letter-spacing: 0.5px; }
    .product-name { font-size: 14px; font-weight: 700; color: var(--slate-800); margin: 6px 0; }
    .product-price { font-size: 16px; font-weight: 800; color: var(--brand-green); }
    .product-sku { font-size: 9px; font-weight: 600; font-family: monospace; color: var(--slate-700); background: var(--slate-200); padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
    
    .cart-card { display: flex; flex-direction: column; height: fit-content; position: sticky; top: 20px; }
    .cart-title { font-size: 18px; font-weight: 800; color: var(--brand-dark); margin-bottom: 16px; border-b: 1px solid var(--slate-100); padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .cart-empty { text-align: center; color: var(--slate-700); padding: 40px 0; font-size: 14px; font-weight: 500; }
    .cart-items { max-height: 280px; overflow-y: auto; margin-bottom: 16px; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed var(--slate-100); font-size: 13px; }
    .cart-item-name { font-weight: 700; color: var(--slate-800); }
    .cart-item-qty { font-weight: 500; color: var(--slate-700); font-size: 12px; margin-top: 2px; }
    .cart-item-price { font-weight: 800; color: var(--slate-800); }
    .cart-item-remove { font-weight: bold; color: #f32230; cursor: pointer; border: none; background: none; font-size: 12px; margin-left: 10px; }
    
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--slate-700); margin-bottom: 6px; letter-spacing: 0.5px; }
    .select-input { width: 100%; padding: 10px 14px; border: 1px solid var(--slate-200); border-radius: 10px; font-size: 13px; font-weight: 600; outline: none; background: white; cursor: pointer; }
    
    .cart-totals { border-top: 1.5px solid var(--slate-100); padding-top: 14px; margin-bottom: 16px; font-size: 13px; }
    .totals-line { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--slate-700); font-weight: 600; }
    .totals-line.grand-total { font-size: 20px; font-weight: 900; color: var(--brand-green); border-top: 1px dashed var(--slate-200); padding-top: 10px; margin-top: 10px; }
    
    .btn { display: block; width: 100%; border: none; border-radius: 12px; font-weight: 800; font-size: 13px; padding: 12px; margin-bottom: 8px; cursor: pointer; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; }
    .btn-green { background: var(--brand-green); color: white; }
    .btn-green:hover { background: #0c8c43; transform: scale(1.01); }
    .btn-slate { background: var(--slate-800); color: white; }
    .btn-slate:hover { background: var(--slate-900); }
    .btn-blue { background: var(--brand-blue); color: white; }
    .btn-blue:hover { background: #085da5; }
    
    .queue-manager { margin-top: 24px; border-top: 2.5px solid var(--slate-100); padding-top: 24px; }
    .queue-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: var(--slate-700); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .queue-count { font-size: 10px; padding: 2px 8px; border-radius: 99px; background: var(--slate-200); color: var(--slate-900); font-weight: 900; }
    .queue-list { max-height: 180px; overflow-y: auto; background: var(--slate-100); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
    .queue-item { display: flex; justify-content: space-between; align-items: center; padding: 6px; background: white; border-radius: 6px; border: 1px solid var(--slate-200); }
    .queue-item-details { display: flex; flex-direction: column; }
    .queue-item-id { font-weight: bold; }
    .queue-item-desc { font-size: 9px; color: var(--slate-700); margin-top: 2px; }
    .queue-item-amount { font-weight: 900; color: var(--brand-green); }
    
    .notification { position: fixed; bottom: 20px; right: 20px; padding: 12px 20px; background: var(--brand-dark); color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid var(--brand-green); font-size: 12px; font-weight: 700; z-index: 1000; display: none; }
  </style>
</head>
<body>

  <header>
    <div>
      <h1>Biashara Sasa <span>Offline POS</span></h1>
      <div style="font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 600; margin-top: 4px;">Dynamic Interoperability Mode</div>
    </div>
    <div style="display: flex; gap: 8px;">
      <span class="badge">Offline Terminal</span>
      <span id="connectionBadge" class="badge badge-offline">No Server Connect</span>
    </div>
  </header>

  <div class="container">
    <div class="card">
      <input type="text" id="searchBar" class="search-box" placeholder="Search product catalog by name or category...">
      <div class="products-grid" id="productsGrid"></div>
    </div>
    
    <div class="card cart-card">
      <div class="cart-title">
        <span>Cart Checkout</span>
        <span style="font-size: 12px; color: var(--slate-700);" id="cartCount">0 items</span>
      </div>
      
      <div class="cart-items" id="cartItems"></div>
      
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <select id="paymentSelector" class="select-input">
          <option value="cash">Cash Checkout</option>
          <option value="mobile">M-Pesa (Mobile)</option>
          <option value="card">Card Payment</option>
        </select>
      </div>
      
      <div class="cart-totals">
        <div class="totals-line">
          <span>Cart Subtotal</span>
          <span id="subtotal">KSh 0.00</span>
        </div>
        <div class="totals-line">
          <span>Kenyan VAT (16%)</span>
          <span id="vat">KSh 0.00</span>
        </div>
        <div class="totals-line grand-total">
          <span>Grand Total</span>
          <span id="grandTotal">KSh 0.00</span>
        </div>
      </div>
      
      <button class="btn btn-green" onclick="handleCheckout()">Complete Offline Sale</button>
      <button class="btn btn-slate" onclick="clearCart()">Reset Workspace</button>
      
      <div class="queue-manager">
        <div class="queue-title">
          <span>Pending Sync Queue</span>
          <span class="queue-count" id="queueCount">0</span>
        </div>
        <div class="queue-list" id="queueList"></div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button class="btn btn-blue" style="margin: 0; flex: 1;" onclick="exportSyncQueue()">Export Ledger JSON</button>
          <button class="btn btn-slate" style="margin: 0; background-color: #f32230; flex: 1;" onclick="clearSyncQueue()">Reset Queue</button>
        </div>
        <p style="font-size: 10px; color: var(--slate-700); font-weight: 500; text-align: center; margin-top: 8px; line-height: 1.4;">
          Exported ledger files can be uploaded directly into your online Biashara Sasa dashboard to synchronize stock and sync sales.
        </p>
      </div>
    </div>
  </div>

  <div id="toast" class="notification"></div>

  <script>
    const products = \${JSON.stringify(embeddedProducts)};
    let cart = [];
    let salesQueue = [];

    // Load initial queue
    try {
      const savedQueue = localStorage.getItem('biashara_sales_queue');
      if (savedQueue) {
        salesQueue = JSON.parse(savedQueue);
      }
    } catch (e) {
      console.error('Failed to load queue', e);
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }

    function renderProducts(search = '') {
      const grid = document.getElementById('productsGrid');
      grid.innerHTML = '';
      
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.category.toLowerCase().includes(search.toLowerCase())
      );
      
      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--slate-700); padding: 40px; font-weight: 600;">No catalog matches found.</div>';
        return;
      }

      filtered.forEach(p => {
        const itemCard = document.createElement('div');
        itemCard.className = 'product-card';
        itemCard.onclick = () => addToCart(p);
        
        const priceFormatted = (p.price / 100).toFixed(2);
        
        itemCard.innerHTML = \\\`
          <div>
            <span class="product-category">\\\${p.category}</span>
            <div class="product-name">\\\${p.name}</div>
          </div>
          <div>
            <div class="product-sku">\\\${p.sku}</div>
            <div class="product-price" style="margin-top: 6px;">KSh \\\${priceFormatted}</div>
          </div>
        \\\`;
        grid.appendChild(itemCard);
      });
    }

    function addToCart(product) {
      const index = cart.findIndex(c => c.id === product.id);
      if (index > -1) {
        cart[index].quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      renderCart();
      showToast('Added ' + product.name);
    }

    function removeFromCart(productId) {
      cart = cart.filter(c => c.id !== productId);
      renderCart();
    }

    function clearCart() {
      cart = [];
      renderCart();
    }

    function renderCart() {
      const list = document.getElementById('cartItems');
      const countEl = document.getElementById('cartCount');
      list.innerHTML = '';

      if (cart.length === 0) {
        list.innerHTML = '<div class="cart-empty">Shopping cart workspace is fully cleared.</div>';
        countEl.innerText = '0 items';
        updateTotals(0);
        return;
      }

      let subtotalSum = 0;
      let qtySum = 0;

      cart.forEach(c => {
        subtotalSum += c.price * c.quantity;
        qtySum += c.quantity;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = \\\`
          <div>
            <span class="cart-item-name">\\\${c.name}</span>
            <div class="cart-item-qty">\\\${c.quantity}x @ KSh \\\${(c.price / 100).toFixed(2)}</div>
          </div>
          <div style="display: flex; align-items: center;">
            <span class="cart-item-price">KSh \\\${((c.price * c.quantity) / 100).toFixed(2)}</span>
            <button class="cart-item-remove" onclick="event.stopPropagation(); removeFromCart(\\\${c.id})">×</button>
          </div>
        \\\`;
        list.appendChild(row);
      });

      countEl.innerText = qtySum + ' item' + (qtySum > 1 ? 's' : '');
      updateTotals(subtotalSum);
    }

    function updateTotals(subtotalCents) {
      const subtotalFormatted = (subtotalCents / 100).toFixed(2);
      const vatFormatted = (subtotalCents * 0.16 / 100).toFixed(2);
      const grantTotalFormatted = (subtotalCents * 1.16 / 100).toFixed(2);

      document.getElementById('subtotal').innerText = 'KSh ' + subtotalFormatted;
      document.getElementById('vat').innerText = 'KSh ' + vatFormatted;
      document.getElementById('grandTotal').innerText = 'KSh ' + grantTotalFormatted;
    }

    function handleCheckout() {
      if (cart.length === 0) {
        showToast('Your checkout workspace is empty!');
        return;
      }

      const rawSubtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
      const totalAmountCents = Math.round(rawSubtotal * 1.16);
      const paymentMethod = document.getElementById('paymentSelector').value;
      const orderNumber = 'BS-OFF-' + Math.floor(100000 + Math.random() * 900000);

      const syncOrder = {
        orderNumber,
        totalAmount: totalAmountCents,
        paymentMethod,
        items: cart.map(c => ({
          productId: c.id,
          productName: c.name,
          quantity: c.quantity,
          unitPrice: c.price,
          totalPrice: c.price * c.quantity
        })),
        createdAt: new Date().toISOString()
      };

      salesQueue.push(syncOrder);
      localStorage.setItem('biashara_sales_queue', JSON.stringify(salesQueue));
      
      clearCart();
      renderQueue();
      showToast('Offline Sale Logged to Sync Queue!');
    }

    function renderQueue() {
      const list = document.getElementById('queueList');
      const countEl = document.getElementById('queueCount');
      list.innerHTML = '';
      
      countEl.innerText = salesQueue.length;

      if (salesQueue.length === 0) {
        list.innerHTML = '<div style="color: var(--slate-700); text-align: center; padding: 12px; font-weight: 600;">Queue is empty. Ready for offline sales.</div>';
        return;
      }

      salesQueue.forEach((q, idx) => {
        const row = document.createElement('div');
        row.className = 'queue-item';
        row.innerHTML = \\\`
          <div class="queue-item-details">
            <span class="queue-item-id">\\\${q.orderNumber}</span>
            <span class="queue-item-desc">\\\${q.items.length} unique products · \\\${q.paymentMethod.toUpperCase()}</span>
          </div>
          <span class="queue-item-amount">KSh \\\${(q.totalAmount / 100).toFixed(2)}</span>
        \\\`;
        list.appendChild(row);
      });
    }

    function exportSyncQueue() {
      if (salesQueue.length === 0) {
        showToast('Queue is empty! No sales data to export.');
        return;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ orders: salesQueue }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "biashara_offline_sync_" + Date.now() + ".json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Offline Ledger Ledger JSON downloaded!');
    }

    function clearSyncQueue() {
      if (confirm('Clear all local transactions? This operation cannot be undone.')) {
        salesQueue = [];
        localStorage.removeItem('biashara_sales_queue');
        renderQueue();
        showToast('Local transactions cleared.');
      }
    }

    document.getElementById('searchBar').oninput = (e) => {
      renderProducts(e.target.value);
    };

    // Initialize
    renderProducts();
    renderCart();
    renderQueue();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biashara_sasa_offline_pos.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const fetchUsers = async () => {
    if (profile?.role !== 'back-office') return;
    setLoadingUsers(true);
    setUserError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setUserError(err.message || 'Could not load system users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [profile]);

  const handleRoleChange = async (userId: number, newRole: 'back-office' | 'trader') => {
    setUserError(null);
    setUserSuccessCode(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to update user role');
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      // Flash success
      setUserSuccessCode(userId);
      setTimeout(() => setUserSuccessCode(null), 3000);
    } catch (err: any) {
      console.error(err);
      setUserError(err.message || 'Failed to change role.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-brand-green" />
          <h2 className="text-3xl font-black text-brand-dark tracking-tight">{t.settings.title}</h2>
        </div>
        {profile?.role === 'back-office' && (
          <button 
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-xl font-bold text-xs border border-slate-200/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            Sync Users
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Stack Account & Preferred Languages) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Information */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg">{t.settings.account}</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 truncate text-sm">
                    {profile?.email?.toLowerCase() === 'njoroge@biasharasasa.com' ? 'Admin Njoroge' : 'User Member'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  {t.settings.email}
                </label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700 truncate text-sm">{profile?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">
                  {t.settings.role}
                </label>
                <div className="flex items-center gap-3 p-4 bg-brand-green/5 rounded-2xl border border-brand-green/10">
                  <Shield className="w-4 h-4 text-brand-green shrink-0" />
                  <span className="font-black text-brand-green uppercase text-xs tracking-wider">
                    {profile?.role === 'back-office' ? 'Back Office Admin' : 'Trader'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Preferences Language */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg">{t.settings.language}</h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    language === lang.id 
                      ? 'bg-brand-blue/5 border-brand-blue/30 scale-[1.02]' 
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className={`font-bold ${language === lang.id ? 'text-brand-dark' : ''}`}>
                      {lang.label}
                    </span>
                  </div>
                  {language === lang.id && (
                    <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column (Dynamic Roles & Access Control or Static Info) */}
        <div className="lg:col-span-2 space-y-6">
          
          {profile?.role === 'back-office' ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-brand-dark text-lg">System Users & Roles</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Configure user logins and access rules system-wide.</p>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-brand-green/40 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all text-slate-700"
                  />
                </div>
              </div>

              {/* Status messages info */}
              {userError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                {loadingUsers && users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw className="w-8 h-8 text-brand-green animate-spin" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing database registers...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-sm font-medium">No registered system users matched your search criteria.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-4">Email Register</th>
                        <th className="pb-4">System Identity</th>
                        <th className="pb-4">Access Role Privilege</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((userRecord) => {
                        const isSelf = userRecord.email.toLowerCase() === profile?.email?.toLowerCase();
                        return (
                          <tr key={userRecord.id} className="text-xs">
                            <td className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{userRecord.email}</span>
                                <span className="text-[10px] font-medium text-slate-400 font-mono mt-0.5">UID: {userRecord.uid.substring(0, 10)}...</span>
                              </div>
                            </td>
                            <td className="py-4 text-slate-500 font-medium">
                              {userRecord.traderId ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold text-[10px] uppercase border border-blue-100">
                                  <Briefcase className="w-3 h-3" /> Linked Trader
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border border-slate-100">
                                  Platform User
                                </span>
                              )}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-wider ${
                                  userRecord.role === 'back-office' 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  {userRecord.role === 'back-office' ? 'Back-Office Admin' : 'Trader'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              {isSelf ? (
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                  Your Account
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {userSuccessCode === userRecord.id && (
                                    <motion.span 
                                      initial={{ scale: 0.8 }} 
                                      animate={{ scale: 1 }} 
                                      className="text-brand-green flex items-center gap-1 text-[11px] font-bold mr-2"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Updated
                                    </motion.span>
                                  )}
                                  
                                  <button
                                    onClick={() => handleRoleChange(
                                      userRecord.id, 
                                      userRecord.role === 'back-office' ? 'trader' : 'back-office'
                                    )}
                                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase transition-all tracking-wider cursor-pointer ${
                                      userRecord.role === 'back-office'
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                                        : 'bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white border border-brand-green/10'
                                    }`}
                                  >
                                    {userRecord.role === 'back-office' ? 'Revoke Admin' : 'Grant Admin'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-brand-light-green/20 p-8 rounded-[36px] border border-brand-green/10 space-y-4"
            >
              <h3 className="text-xl font-black text-brand-dark flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-green" />
                Empowering Daily Commerce
              </h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm">
                As a registered trader, you have access to clean, modern Point of Sale tools, automatic inventory counters, low-stock warnings, and historic reports.
              </p>
              <p className="text-slate-500 font-medium leading-relaxed text-xs pt-1">
                Role modifications (such as promotion to back-office coordinator status) are managed strictly by verified administrative managers through authorization keys.
              </p>
            </motion.div>
          )}

          {/* Biashara Sasa Interoperability & Sync Hub */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-lg">Biashara Sasa Interoperability Hub</h3>
                  <p className="text-xs text-slate-400 font-medium font-sans">Interoperate online cloud database with standalone offline retail systems.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green font-black text-[9px] uppercase tracking-wider border border-brand-green/10 w-fit">
                <Sparkles className="w-3 h-3" /> Sync Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Left Box (Export data catalogs) */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                    <Download className="w-3.5 h-3.5 text-brand-blue" />
                    Offline Ledger Exports
                  </h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed font-sans">
                    Export your active product listings to maintain inventory databases on legacy registers or spreadsheets.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button 
                      onClick={exportProductsCSV}
                      className="flex-1 min-w-[120px] py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      CSV Format
                    </button>
                    <button 
                      onClick={exportProductsJSON}
                      className="flex-1 min-w-[120px] py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5 text-slate-400" />
                      JSON Format
                    </button>
                  </div>
                </div>
                 
                <div className="pt-4 border-t border-slate-200/60 space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">
                    Decentralized Retail Client
                  </label>
                  <button 
                    onClick={downloadOfflinePOSClient}
                    className="w-full py-2.5 px-4 bg-brand-green text-white hover:bg-brand-green-hover rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Terminal className="w-4 h-4" />
                    Deploy Standalone Offline POS
                  </button>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                    Downloads a self-contained, fully offline-functional single-file HTML POS application pre-loaded with your exact registered products list and categories, featuring offline sale queues and local-storage ledger state.
                  </p>
                </div>
              </div>

              {/* Right Box (Import & Sync sales queue) */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-sans">
                    <Upload className="w-3.5 h-3.5 text-brand-green" />
                    Integrated Synced Ledgers
                  </h4>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed font-sans">
                    Import transactions made from the offline terminal back into the cloud. Files uploaded are parsed, synced into sales ledgers, and auto-adjusted against live registers in real-time.
                  </p>

                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Drag and Drop Zone Mockup */}
                  <div 
                    onClick={handleImportJSONClick}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      syncLoading 
                        ? 'border-brand-green bg-brand-green/5 animate-pulse' 
                        : 'border-slate-200 hover:border-brand-green hover:bg-white'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 text-slate-400 ${syncLoading ? 'animate-bounce text-brand-green' : ''}`} />
                    <span className="block text-xs font-bold text-slate-700 font-sans">
                      {syncLoading ? 'Integrating sales ledgers...' : 'Click to Upload offline ledgers (.json)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1 font-sans">
                      Accepts serialized json files from offline POS downloads.
                    </span>
                  </div>
                </div>

                {/* Processing Reports Statuses */}
                <AnimatePresence mode="wait">
                  {syncStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-bold leading-normal font-sans ${
                        syncStatus.type === 'success' 
                          ? 'bg-brand-green/5 border-brand-green/20 text-brand-green' 
                          : syncStatus.type === 'error'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}
                    >
                      {syncStatus.type === 'info' ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                      ) : syncStatus.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span>{syncStatus.message}</span>
                        {syncStatus.type !== 'info' && (
                          <button 
                            onClick={() => setSyncStatus(null)}
                            className="block text-[10px] uppercase font-black tracking-wider mt-2 hover:opacity-85 text-slate-500 cursor-pointer"
                          >
                            Dismiss Report
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          </motion.div>

          {/* Roles & Permissions Explanation Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="w-16 h-16 rounded-[22px] bg-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black">{t.settings.rolesManagement}</h3>
              <p className="text-white/60 font-medium text-xs leading-relaxed max-w-2xl">
                {profile?.role === 'back-office' 
                  ? t.settings.adminNote
                  : t.settings.traderNote
                }
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
