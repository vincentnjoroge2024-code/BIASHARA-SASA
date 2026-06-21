import React, { useState } from 'react';
import { Trash2, Users, UserX, Download, Search } from 'lucide-react';
import { Trader } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TraderListProps {
  traders: Trader[];
  onDelete: (id: number) => void;
}

export function TraderList({ traders, onDelete }: TraderListProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTraders = traders.filter(trader => 
    trader.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trader.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleExportCSV = () => {
    const tradersToExport = searchQuery ? filteredTraders : traders;
    if (tradersToExport.length === 0) return;

    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Location', 'Plan', 'Status', 'Onboarded At'];
    const rows = tradersToExport.map((t, index) => [
      index + 1,
      t.fullName,
      t.email,
      t.phone || '—',
      t.location || '—',
      t.plan,
      t.status,
      new Date(t.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `biashara_sasa_traders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#1a4b6d]" /> {t.traderList.title}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredTraders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="w-4 h-4 text-[#1a4b6d]" />
            {t.traderList.export}
          </button>
          <span className="bg-slate-100 px-4 py-1 rounded-full text-sm font-bold text-slate-700">
            {filteredTraders.length} {t.traderList.tradersCount}{filteredTraders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#1a4b6d] transition-colors" />
        </div>
        <input
          type="text"
          placeholder={t.traderList.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#1a4b6d]/5 focus:border-[#1a4b6d] transition-all shadow-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200 text-sm font-bold text-slate-700">
              <th className="px-5 py-4">#</th>
              <th className="px-5 py-4">{t.traderList.name}</th>
              <th className="px-5 py-4">{t.traderList.email}</th>
              <th className="px-5 py-4">{t.traderList.plan}</th>
              <th className="px-5 py-4">{t.traderList.status}</th>
              <th className="px-5 py-4 text-center">{t.traderList.action}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTraders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <UserX className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-500 font-medium">{t.traderList.noTraders}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTraders.map((trader, index) => (
                <tr key={trader.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-4 font-bold text-[#0b1a2e]">{trader.fullName}</td>
                  <td className="px-5 py-4 text-slate-600">{trader.email}</td>
                  <td className="px-5 py-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight">
                      {trader.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusClass(trader.status)}`}>
                      {trader.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`${t.traderList.confirmDelete} "${trader.fullName}"?`)) {
                          onDelete(trader.id);
                        }
                      }}
                      className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
