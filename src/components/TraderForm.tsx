import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Tag, ToggleRight, PlusCircle, Info, Database, CheckCircle } from 'lucide-react';
import { SubscriptionPlan, TraderStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TraderFormProps {
  onSubmit: (data: any) => Promise<void>;
  traderCount: number;
}

export function TraderForm({ onSubmit, traderCount }: TraderFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    plan: 'Pro' as SubscriptionPlan,
    status: 'active' as TraderStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        plan: 'Pro' as SubscriptionPlan,
        status: 'active' as TraderStatus,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-2">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-1 text-brand-dark">
          <PlusCircle className="text-brand-green" /> {t.traderForm.title}
        </h2>
        <p className="text-slate-500 text-sm mb-6">{t.traderForm.description}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <User className="w-4 h-4 text-brand-blue" /> {t.traderForm.fullName}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grace Mwangi"
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Mail className="w-4 h-4 text-brand-blue" /> {t.traderForm.email}
              </label>
              <input
                type="email"
                required
                placeholder="trader@example.com"
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Phone className="w-4 h-4 text-brand-blue" /> {t.traderForm.phone}
              </label>
              <input
                type="text"
                placeholder="+254 7XX XXX XXX"
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <MapPin className="w-4 h-4 text-brand-blue" /> {t.traderForm.location}
              </label>
              <input
                type="text"
                placeholder="Nairobi, Kenya"
                className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
              <Tag className="w-4 h-4 text-brand-blue" /> {t.traderForm.plan}
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all cursor-pointer"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as SubscriptionPlan })}
            >
              <option value="Basic">Basic · Free</option>
              <option value="Pro">Pro · KSh 2,900/mo</option>
              <option value="Enterprise">Enterprise · KSh 9,900/mo</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold flex items-center gap-2 text-slate-800">
              <ToggleRight className="w-4 h-4 text-brand-blue" /> {t.traderForm.status}
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border-1.5 border-slate-200 bg-slate-50 focus:outline-none focus:border-brand-green focus:ring-4 focus:ring-brand-green/10 transition-all cursor-pointer"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TraderStatus })}
            >
              <option value="active">{t.common.active}</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-brand-green to-brand-dark text-white py-3.5 rounded-full font-bold text-lg hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-brand-green/25 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            {isSubmitting ? t.traderForm.submitting : t.traderForm.submit}
          </button>
        </form>
      </div>

      <div className="bg-[#fafcfd] border border-slate-200 p-6 rounded-[32px] self-start flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-brand-dark">
            <Info className="w-5 h-5 text-brand-blue" /> {t.traderForm.guide}
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-brand-green" /> {t.traderForm.guide1}
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-brand-green" /> {t.traderForm.guide2}
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-brand-green" /> {t.traderForm.guide3}
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-brand-green" /> {t.traderForm.guide4}
            </li>
          </ul>
        </div>
        <div className="bg-slate-200/50 py-4 rounded-2xl text-center">
           <Database className="inline w-5 h-5 text-brand-blue mr-2" />
           <span className="font-bold text-brand-dark">{traderCount} {t.traderForm.onboardedStatus}{traderCount !== 1 ? 's' : ''} </span>
        </div>
      </div>
    </div>
  );
}
