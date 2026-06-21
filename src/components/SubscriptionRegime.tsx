import React, { useState } from 'react';
import { 
  Crown, 
  Sprout, 
  Rocket, 
  Building, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  CreditCard,
  UserCheck,
  Zap,
  Power,
  Search,
  Check,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TraderStats, UserProfile, Trader, SubscriptionPlan, TraderStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionRegimeProps {
  stats: TraderStats;
  profile: UserProfile | null;
  traders: Trader[];
  onUpdateSubscription: (traderId: number, plan: SubscriptionPlan, status: TraderStatus) => Promise<void>;
}

export function SubscriptionRegime({ stats, profile, traders, onUpdateSubscription }: SubscriptionRegimeProps) {
  const { t } = useLanguage();
  const [processing, setProcessing] = useState<number | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  // Find current trader if role is 'trader'
  const currentTrader = traders.find(t => t.id === profile?.traderId || t.email === profile?.email);
  const isTrader = profile?.role === 'trader';

  const handleAction = async (traderId: number, plan: SubscriptionPlan, status: TraderStatus) => {
    setProcessing(traderId);
    try {
      await onUpdateSubscription(traderId, plan, status);
    } finally {
      setProcessing(null);
    }
  };

  const filteredTraders = traders.filter(trader => 
    trader.fullName.toLowerCase().includes(adminSearch.toLowerCase()) ||
    trader.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
    trader.location?.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl pb-10">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-brand-dark flex items-center gap-2.5 tracking-tight">
            <Crown className="text-yellow-500 w-8 h-8 fill-yellow-500/10" /> 
            <span>Subscription Regimes</span>
          </h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            {isTrader 
              ? 'View and manage your active retail partner tier and payments.' 
              : 'Configure operational tiers, manage pending entries, and restore suspended partners.'
            }
          </p>
        </div>
        
        {isTrader && currentTrader && (
          <span className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            currentTrader.status === 'active' 
              ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' 
              : currentTrader.status === 'pending'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              currentTrader.status === 'active' ? 'bg-brand-green' : currentTrader.status === 'pending' ? 'bg-amber-500' : 'bg-rose-600'
            }`} />
            Status: {currentTrader.status.toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER COLUMNS: Plans or Active Trader Profile */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TRADER SPECIFIC CURRENT STATUS BANNER */}
          {isTrader && currentTrader && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-[32px] border ${
                currentTrader.status === 'active'
                  ? 'bg-brand-green/5 border-brand-green/20 text-slate-700'
                  : currentTrader.status === 'pending'
                  ? 'bg-amber-500/5 border-amber-500/10 text-slate-700'
                  : 'bg-rose-500/5 border-rose-500/10 text-slate-700'
              } flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your Linked Business account</span>
                <h3 className="text-lg font-black text-brand-dark">{currentTrader.fullName}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Currently subscribed to the <strong className="text-brand-green font-bold uppercase">{currentTrader.plan}</strong> license. Registered from {currentTrader.location || 'Nairobi Hub'}.
                </p>
                {currentTrader.status === 'inactive' && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Your business subscription is restricted. Select a plan below to restore access.
                  </p>
                )}
                {currentTrader.status === 'pending' && (
                  <p className="text-xs text-amber-600 font-bold flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5" /> Your payment confirmation is pending. Restore and confirm subscription status instantly.
                  </p>
                )}
              </div>

              {currentTrader.status !== 'active' && (
                <button
                  type="button"
                  disabled={processing === currentTrader.id}
                  onClick={() => handleAction(currentTrader.id, currentTrader.plan, 'active')}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-green/15 cursor-pointer disabled:opacity-50"
                >
                  {processing === currentTrader.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Restore Active subscription
                </button>
              )}
            </motion.div>
          )}

          {/* SUBSCRIPTION VALUE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BASIC */}
            <div className={`p-6 rounded-[28px] border bg-white flex flex-col hover:shadow-md transition-all ${
              isTrader && currentTrader?.plan === 'Basic' ? 'border-brand-green-dark ring-2 ring-brand-green-dark/10' : 'border-slate-100'
            }`}>
              <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Sprout className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Basic</h4>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-black text-brand-dark">KSh 0</span>
                  <span className="text-xs text-slate-400 font-semibold">/month</span>
                </div>
              <ul className="space-y-3.5 text-xs text-slate-500 flex-1 border-t border-slate-100 pt-4 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Up to 10 products stock</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Standard Thermal receipt printer setup</span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <X className="w-3.5 h-3.5" />
                  <span>Unlimited orders history logs</span>
                </li>
              </ul>
              
              {isTrader && currentTrader && (
                <button
                  type="button"
                  disabled={processing !== null || currentTrader.plan === 'Basic'}
                  onClick={() => handleAction(currentTrader.id, 'Basic', 'active')}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all cursor-pointer ${
                    currentTrader.plan === 'Basic'
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {currentTrader.plan === 'Basic' ? 'Current Active Regime' : 'Downgrade to Basic'}
                </button>
              )}
            </div>

            {/* PRO */}
            <div className={`p-6 rounded-[28px] border bg-gradient-to-b from-brand-blue/5 to-white flex flex-col hover:shadow-lg transition-all relative ${
              isTrader && currentTrader?.plan === 'Pro' ? 'border-brand-green ring-2 ring-brand-green-dark/10' : 'border-brand-blue/20'
            }`}>
              <div className="absolute top-4 right-4 bg-brand-green text-white px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md">
                Popular
              </div>
              <div className="w-12 h-12 bg-white text-brand-blue rounded-2xl flex items-center justify-center mb-4 border border-brand-blue/10">
                <Rocket className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-brand-blue uppercase tracking-widest leading-none">Pro</h4>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-black text-brand-dark">KSh 2,900</span>
                  <span className="text-xs text-slate-400 font-semibold">/month</span>
                </div>
              <ul className="space-y-3.5 text-xs text-slate-600 flex-1 border-t border-brand-blue/10 pt-4 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span className="font-semibold">Unlimited Trades & Inventory</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Line Chart Sales Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Advanced Bill Receipt profiles</span>
                </li>
              </ul>
              
              {isTrader && currentTrader && (
                <button
                  type="button"
                  disabled={processing !== null}
                  onClick={() => handleAction(currentTrader.id, 'Pro', 'active')}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all cursor-pointer ${
                    currentTrader.plan === 'Pro'
                      ? 'bg-brand-green text-white shadow-md'
                      : 'bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white'
                  }`}
                >
                  {currentTrader.plan === 'Pro' 
                    ? currentTrader.status === 'active' ? 'Active Pro License' : 'Restore & Activate Pro'
                    : 'Upgrade to Pro'
                  }
                </button>
              )}
            </div>

            {/* ENTERPRISE */}
            <div className={`p-6 rounded-[28px] border bg-white flex flex-col hover:shadow-md transition-all ${
              isTrader && currentTrader?.plan === 'Enterprise' ? 'border-brand-green-dark ring-2 ring-brand-green-dark/10' : 'border-slate-100'
            }`}>
              <div className="w-12 h-12 bg-slate-50 text-[#1a4b6d] rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Enterprise</h4>
                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl font-black text-brand-dark">KSh 9,900</span>
                  <span className="text-xs text-slate-400 font-semibold">/month</span>
                </div>
              <ul className="space-y-3.5 text-xs text-slate-500 flex-1 border-t border-slate-100 pt-4 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Whiteglove Multi-trader sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Priority operational managers help</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span>Custom integration API slots</span>
                </li>
              </ul>
              
              {isTrader && currentTrader && (
                <button
                  type="button"
                  disabled={processing !== null}
                  onClick={() => handleAction(currentTrader.id, 'Enterprise', 'active')}
                  className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-center transition-all cursor-pointer ${
                    currentTrader.plan === 'Enterprise'
                      ? 'bg-brand-green text-white shadow-md'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {currentTrader.plan === 'Enterprise'
                    ? currentTrader.status === 'active' ? 'Active Enterprise' : 'Restore & Activate'
                    : 'Upgrade Enterprise'
                  }
                </button>
              )}
            </div>

          </div>

          {/* BACK-OFFICE OPERATIONS PANEL: MANAGE INDIVIDUAL SUBSCRIPTIONS */}
          {!isTrader && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-brand-green" />
                    <span>Active Partnership Subscriptions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Verify credentials, adjust payment records, restore statuses.</p>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, plan or region..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 focus:bg-white focus:border-brand-green rounded-xl text-xs font-bold outline-none transition-all text-slate-700"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="px-4 py-3">Trader Register</th>
                      <th className="px-4 py-3">Assigned Plan</th>
                      <th className="px-4 py-3">Subscription Status</th>
                      <th className="px-4 py-3 text-right">Regime Management Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredTraders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400 font-semibold">
                          No trader register matches criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTraders.map((trader) => (
                        <tr key={trader.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-4">
                            <span className="font-extrabold text-brand-dark block">{trader.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-bold block">{trader.email}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase">
                              {trader.plan}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                              trader.status === 'active' 
                                ? 'bg-brand-green/10 text-brand-green' 
                                : trader.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                trader.status === 'active' ? 'bg-brand-green' : trader.status === 'pending' ? 'bg-amber-500' : 'bg-rose-600'
                              }`} />
                              {trader.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Change plan controls */}
                              <select
                                value={trader.plan}
                                onChange={(e) => handleAction(trader.id, e.target.value as SubscriptionPlan, trader.status)}
                                className="bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
                              >
                                <option value="Basic">Basic</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                              </select>

                              {trader.status !== 'active' ? (
                                <button
                                  type="button"
                                  disabled={processing === trader.id}
                                  onClick={() => handleAction(trader.id, trader.plan, 'active')}
                                  className="px-3 py-1.5 rounded-xl bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                  title="Approve / Restore active account"
                                >
                                  {processing === trader.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Power className="w-3 h-3" />
                                  )}
                                  Restore Status
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={processing === trader.id}
                                  onClick={() => handleAction(trader.id, trader.plan, 'inactive')}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                  title="Suspend subscription access"
                                >
                                  {processing === trader.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Zap className="w-3 h-3" />
                                  )}
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>

        {/* RIGHT COLUMN: Aggregate Statistics or Account summary info */}
        <div className="lg:col-span-1 space-y-6">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-dark p-8 rounded-[36px] text-white space-y-6 shadow-xl shadow-slate-900/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-blue" />
              </div>
              <h3 className="font-extrabold text-lg">Platform Volumes</h3>
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-white/60 font-semibold text-xs">Registered Partners:</span>
                <span className="font-black text-lg">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-white/5 pt-3">
                <span className="text-white/60 font-semibold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-green" />
                  Active Subscriptions:
                </span>
                <span className="font-black text-lg text-emerald-400">{stats.subscribedTotal}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-white/5 pt-3">
                <span className="text-white/60 font-semibold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pending activation:
                </span>
                <span className="font-black text-lg text-amber-300">{stats.pending}</span>
              </div>
            </div>

            <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest pt-4 text-center border-t border-white/10">
              Biashara Sasa Engine Ltd
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-50 p-6 rounded-[32px] border border-slate-150 space-y-4"
          >
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5 text-brand-green" />
              Service Status Operations
            </h4>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              When a trader account status falls out of active compliance (pending invoice clearance or suspension), they are immediately locked from posting real-time point-of-sale entries.
            </p>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed pt-2">
              Traders can use the quick <strong>"Restore Active Subscription"</strong> action box on their regime tab to trigger license restoration.
            </p>
          </motion.div>

        </div>

      </div>

    </div>
  );
}
