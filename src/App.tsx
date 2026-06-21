import React, { useState, useEffect, useCallback } from 'react';
import { ChartLine, Users, CheckCircle2, RotateCw, LogOut, Lock, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Trader, TraderStats, Invoice, SubscriptionPlan, Product, POSOrder, TraderStatus } from './types';
import { TraderForm } from './components/TraderForm';
import { TraderList } from './components/TraderList';
import { SubscriptionRegime } from './components/SubscriptionRegime';
import { InventoryManager } from './components/InventoryManager';
import { POSDashboard } from './components/POSDashboard';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { TabNavigation, TabType } from './components/TabNavigation';
import { PrimeAxisLogo } from './components/PrimeAxisLogo';
import { InvoiceModal } from './components/InvoiceModal';
import { ToastContainer, ToastType } from './components/Toast';
import { useAuth } from './hooks/useAuth';

import { useLanguage } from './contexts/LanguageContext';
import { Language } from './translations';

export default function App() {
  const { user, profile, loading, signIn, signInWithEmail, signUpWithEmail, logOut, getToken } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [traders, setTraders] = useState<Trader[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: ToastType; message: string }[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  // Email login / registration state
  const [authEmail, setAuthEmail] = useState('Njoroge@biasharasasa.com');
  const [authPassword, setAuthPassword] = useState('Biasharasasa123');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail || !authPassword) {
      setAuthError('Please fill in both email and password fields.');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (isRegistering) {
        await signUpWithEmail(authEmail, authPassword);
        showToast('success', 'Account registered successfully!');
      } else {
        await signInWithEmail(authEmail, authPassword);
        showToast('success', 'Logged in successfully!');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        // If they did indeed try the admin email, we can try matching immediately, but we already catch that inside useAuth!
        setAuthError('Email/password registration is not enabled in Firebase. Please enter valid administrative or active trader credentials.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid email or password. Please verify your administrative credentials.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password is too weak. Must be at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please login instead.');
      } else {
        setAuthError(err.message || 'Authentication error.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAutofillAdmin = () => {
    setAuthEmail('Njoroge@biasharasasa.com');
    setAuthPassword('Biasharasasa123');
    setIsRegistering(false);
    setAuthError(null);
  };

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchTraders = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/traders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTraders(data);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch trader data');
    } finally {
      setIsSyncing(false);
    }
  }, [user, getToken, showToast]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch inventory');
    }
  }, [user, getToken, showToast]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/pos/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      showToast('error', 'Failed to fetch sales history');
    }
  }, [user, getToken, showToast]);

  useEffect(() => {
    if (user) {
      fetchTraders();
      fetchProducts();
      fetchOrders();
    }
  }, [user, fetchTraders, fetchProducts, fetchOrders]);

  useEffect(() => {
    if (profile) {
      const allowedTabs: TabType[] = profile.role === 'back-office' 
        ? ['dashboard', 'onboard', 'traders', 'inventory', 'pos', 'regime', 'settings']
        : ['dashboard', 'inventory', 'pos', 'regime', 'settings'];
      
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [profile, activeTab]);

  const handleOnboard = async (data: any) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/traders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('success', `Trader ${data.fullName} onboarded successfully`);
        
        // Generate Invoice
        const prices = { 'Basic': 0, 'Pro': 29, 'Enterprise': 99 };
        const amount = prices[data.plan as SubscriptionPlan] || 0;
        
        if (amount > 0) {
          const invoice: Invoice = {
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            traderName: data.fullName,
            traderEmail: data.email,
            plan: data.plan,
            amount: amount,
            date: new Date().toLocaleDateString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: 'unpaid'
          };
          setCurrentInvoice(invoice);
        }

        fetchTraders();
      }
    } catch (err) {
      showToast('error', 'Onboarding failed');
    }
  };

  const handleAddProduct = async (data: any) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showToast('success', 'Product added to inventory');
        fetchProducts();
      }
    } catch (err) {
      showToast('error', 'Failed to add product');
    }
  };

  const handleAddProductsBulk = async (items: any[]) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        showToast('success', `${items.length} products loaded in bulk!`);
        fetchProducts();
      } else {
        const errData = await res.json();
        showToast('error', errData.error || 'Failed to bulk upload products');
      }
    } catch (err) {
      showToast('error', 'Failed to bulk upload products');
    }
  };

  const handleAdjustStock = async (id: number, change: number, reason: string) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ change, reason })
      });
      if (res.ok) {
        showToast('info', 'Stock levels updated');
        fetchProducts();
      }
    } catch (err) {
      showToast('error', 'Failed to adjust stock');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('info', 'Product removed');
        fetchProducts();
      }
    } catch (err) {
      showToast('error', 'Failed to delete product');
    }
  };

  const handleCheckout = async (data: any): Promise<POSOrder | null> => {
    if (!user) return null;
    try {
      const token = await getToken();
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const order = await res.json();
        showToast('success', 'Transaction completed successfully');
        fetchProducts();
        return order;
      }
      const errData = await res.json();
      showToast('error', errData.error || 'Checkout failed');
      return null;
    } catch (err) {
      showToast('error', 'Checkout failed');
      return null;
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/traders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTraders(prev => prev.filter(t => t.id !== id));
        showToast('info', 'Trader record removed');
      }
    } catch (err) {
      showToast('error', 'Failed to delete record');
    }
  };

  const handleUpdateSubscription = async (traderId: number, plan: SubscriptionPlan, status: TraderStatus) => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/traders/${traderId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, status })
      });
      if (res.ok) {
        showToast('success', 'Subscription restored/updated successfully!');
        
        // Update local traders list state
        setTraders(prev => prev.map(t => t.id === traderId ? { ...t, plan, status } : t));
        
        // Also refresh traders list from DB to be absolutely sure
        fetchTraders();
      } else {
        const errorText = await res.text();
        showToast('error', errorText || 'Failed to update subscription');
      }
    } catch (err) {
      showToast('error', 'Error updating subscription');
    }
  };

  const getStats = (): TraderStats => {
    const active = traders.filter(t => t.status === 'active').length;
    const pending = traders.filter(t => t.status === 'pending').length;
    const subscribedTotal = traders.filter(t => t.plan !== 'Basic').length;
    return {
      total: traders.length,
      active,
      pending,
      subscribedTotal
    };
  };

  const stats = getStats();

  // Check if we are viewing in Web Receipt Verification mode from scanned QR code
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isVerifyMode = searchParams ? searchParams.get('verify') === 'true' : false;

  if (isVerifyMode) {
    const kInvoice = searchParams ? searchParams.get('invoice') : '';
    const kCustomer = searchParams ? searchParams.get('customer') : '';
    const kTotal = searchParams ? searchParams.get('total') : '';
    const kDate = searchParams ? searchParams.get('date') : '';
    const kPayment = searchParams ? searchParams.get('payment') : '';

    const handleBackToPortal = () => {
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-[480px] w-full bg-white rounded-[32px] p-8 md:p-10 shadow-2xl shadow-emerald-990/10 border border-emerald-500/20 text-center relative overflow-hidden"
        >
          {/* Elegant top color band */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-200">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>

          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 mb-2">
            ✓ Purchase Verified
          </span>

          <h2 className="text-2xl font-black text-brand-dark tracking-tight">BIASHARASASA</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Official Receipt Verification Portal</p>

          <div className="my-6 border-t border-slate-100"></div>

          <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-100 space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Receipt No</span>
              <span className="text-slate-800 font-mono font-bold">{kInvoice || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Status</span>
              <span className="text-emerald-600 font-black flex items-center gap-1 text-[11px] uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Authentic &amp; Cleared
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Date</span>
              <span className="text-slate-700 font-bold">{kDate ? decodeURIComponent(kDate) : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Customer Name</span>
              <span className="text-slate-700 font-bold">{kCustomer ? decodeURIComponent(kCustomer) : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Payment Method</span>
              <span className="text-slate-700 font-bold">{kPayment ? decodeURIComponent(kPayment) : 'N/A'}</span>
            </div>
            
            <div className="border-t border-dashed border-slate-200 my-2 pt-2.5 flex justify-between items-center">
              <span className="text-slate-500 font-black uppercase text-[10px]">Total Paid</span>
              <span className="text-lg font-black text-brand-green">KSh {kTotal || '0.00'}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-medium leading-relaxed mb-6 mt-4">
            This purchase record has been securely cross-referenced and verified online via Biashara Sasa cloud databases. 
          </div>

          <button
            onClick={handleBackToPortal}
            className="w-full bg-slate-900 hover:bg-brand-dark text-white py-3 px-6 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            Go to Management Portal
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RotateCw className="w-10 h-10 text-brand-green animate-spin" />
          <p className="text-slate-500 font-medium tracking-tight">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-[460px] w-full bg-white rounded-[40px] p-8 md:p-10 shadow-2xl shadow-blue-900/10 border border-white"
        >
          <div className="w-20 h-20 bg-brand-light-green rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-green/10 border border-brand-green/5 p-2 shrink-0">
            <PrimeAxisLogo className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-black text-brand-dark tracking-tight mb-2 text-center">BIASHARASASA</h1>
          <p className="text-slate-500 mb-6 leading-relaxed font-semibold text-center text-sm">
            {t.common.signInDesc}
          </p>

          {/* Email / Password signin forms */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-4 text-left">
            {/* Form selectors */}
            <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 border border-slate-200/50">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setAuthError(null); }}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                  !isRegistering ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setAuthError(null); }}
                className={`py-2 text-xs font-black uppercase rounded-lg transition-all cursor-pointer ${
                  isRegistering ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold leading-relaxed flex items-start gap-2">
                <span className="mt-0.5 font-sans">⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="Enter email..."
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-sm font-bold outline-none focus:border-brand-green/30 focus:bg-white text-slate-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 ml-1">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-250 rounded-xl text-sm font-bold outline-none focus:border-brand-green/30 focus:bg-white text-slate-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white py-3.5 rounded-2xl font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
            >
              {authSubmitting ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {isRegistering ? 'Create Active Account' : 'Authenticate Credentials'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1440px] w-full h-[90vh] bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden flex flex-row"
      >
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} role={profile?.role || 'trader'} />

        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-brand-dark tracking-tight capitalize">
                {activeTab === 'dashboard' ? t.navigation.dashboard :
                 activeTab === 'onboard' ? t.navigation.onboard :
                 activeTab === 'traders' ? t.navigation.allTraders :
                 activeTab === 'inventory' ? t.navigation.inventory :
                 activeTab === 'pos' ? t.navigation.pos :
                 activeTab === 'settings' ? t.navigation.settings :
                 t.navigation.regime}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 border-r border-slate-100 pr-6 mr-2">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-brand-green/30 transition-all text-slate-600"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>

              <div className="flex items-center gap-6 border-r border-slate-100 pr-6 mr-2">
                 {profile?.role === 'back-office' && (
                   <>
                     <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t.common.traders}: <strong className="text-brand-dark ml-1">{stats.total}</strong></span>
                     </div>
                     <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t.common.active}: <strong className="text-brand-dark ml-1">{stats.active}</strong></span>
                     </div>
                   </>
                 )}
                 {profile?.role === 'trader' && (
                   <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Trader Access</span>
                   </div>
                 )}
              </div>
              
              <div className="flex items-center gap-4">
                  <button 
                    onClick={logOut}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-brand-red/10 text-slate-400 hover:text-brand-red transition-all active:scale-95"
                    title={t.common.signOut}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 lg:p-12">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 10 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -10 }}
                 transition={{ duration: 0.2 }}
               >
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      traders={traders} 
                      products={products} 
                      orders={orders} 
                      role={profile?.role || 'trader'}
                    />
                  )}
                  {activeTab === 'onboard' && <TraderForm onSubmit={handleOnboard} traderCount={traders.length} />}
                  {activeTab === 'traders' && <TraderList traders={traders} onDelete={handleDelete} />}
                  {activeTab === 'inventory' && (
                    <InventoryManager 
                      products={products} 
                      onAddProduct={handleAddProduct} 
                      onAdjustStock={handleAdjustStock} 
                      onDeleteProduct={handleDeleteProduct}
                      onAddProductsBulk={handleAddProductsBulk}
                      role={profile?.role || 'trader'}
                      status={traders.find(t => t.id === profile?.traderId || t.email === profile?.email)?.status || 'inactive'}
                    />
                  )}
                  {activeTab === 'pos' && (
                    <POSDashboard 
                      products={products} 
                      onCheckout={handleCheckout} 
                      orders={orders}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <Settings profile={profile} getToken={getToken} />
                  )}
                  {activeTab === 'regime' && (
                    <SubscriptionRegime 
                      stats={stats} 
                      profile={profile} 
                      traders={traders} 
                      onUpdateSubscription={handleUpdateSubscription} 
                    />
                  )}
               </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <InvoiceModal 
        invoice={currentInvoice} 
        onClose={() => setCurrentInvoice(null)} 
        onPay={() => {
          showToast('success', 'Payment successful! Account fully activated.');
          setCurrentInvoice(null);
        }} 
      />
    </div>
  );
}

