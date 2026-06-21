import React from 'react';
import { UserPlus, ListOrdered, Crown, Package, ShoppingCart, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';
import { UserRole } from '../types';
import { PrimeAxisLogo } from './PrimeAxisLogo';

export type TabType = 'dashboard' | 'onboard' | 'traders' | 'regime' | 'inventory' | 'pos' | 'settings';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  role: UserRole;
}

import { useLanguage } from '../contexts/LanguageContext';

export function TabNavigation({ activeTab, onTabChange, role }: TabNavigationProps) {
  const { t } = useLanguage();
  
  const allTabs: { id: TabType; label: string; icon: React.ReactNode; roles: UserRole[] }[] = [
    { id: 'dashboard', label: t.navigation.dashboard, icon: <LayoutDashboard className="w-5 h-5" />, roles: ['back-office', 'trader'] },
    { id: 'onboard', label: t.navigation.onboard, icon: <UserPlus className="w-5 h-5" />, roles: ['back-office'] },
    { id: 'traders', label: t.navigation.allTraders, icon: <ListOrdered className="w-5 h-5" />, roles: ['back-office'] },
    { id: 'inventory', label: t.navigation.inventory, icon: <Package className="w-5 h-5" />, roles: ['back-office', 'trader'] },
    { id: 'pos', label: t.navigation.pos, icon: <ShoppingCart className="w-5 h-5" />, roles: ['back-office', 'trader'] },
    { id: 'regime', label: t.navigation.regime, icon: <Crown className="w-5 h-5" />, roles: ['back-office', 'trader'] },
    { id: 'settings', label: t.navigation.settings, icon: <SettingsIcon className="w-5 h-5" />, roles: ['back-office', 'trader'] },
  ];

  const tabs = allTabs.filter(tab => tab.roles.includes(role));

  return (
    <nav className="w-72 bg-brand-light-green border-r border-brand-green/10 flex flex-col h-full shrink-0">
      <div className="p-8 border-b border-brand-green/10 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-brand-green/5 flex items-center justify-center border border-brand-green/10 p-2">
          <PrimeAxisLogo className="w-full h-full" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-brand-dark tracking-tight leading-none mb-1">{t.common.appName}</h2>
          <p className="text-[10px] font-bold text-brand-green/60 uppercase tracking-widest">{t.common.growthEngine}</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              w-full flex items-center gap-3.5 px-6 py-4 text-sm font-black transition-all rounded-2xl
              ${activeTab === tab.id 
                ? 'text-white bg-brand-green shadow-lg shadow-brand-green/20' 
                : 'text-brand-dark/60 hover:text-brand-green hover:bg-white/50'}
            `}
          >
             {tab.icon}
             <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 border-t border-brand-green/10">
        <div className="bg-white/40 rounded-2xl p-4 border border-white/60">
           <p className="text-[10px] font-black text-brand-dark/40 uppercase tracking-tighter mb-2">{t.common.platformStatus}</p>
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
             <span className="text-[10px] font-bold text-brand-dark/80 tracking-tight">{t.common.systemsOperational}</span>
           </div>
        </div>
      </div>
    </nav>
  );
}
