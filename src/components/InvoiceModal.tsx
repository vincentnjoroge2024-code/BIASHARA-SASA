import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, CheckCircle, X, Receipt, CreditCard } from 'lucide-react';
import { Invoice } from '../types';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPay: () => void;
}

export function InvoiceModal({ invoice, onClose, onPay }: InvoiceModalProps) {
  if (!invoice) return null;

  const handleDownload = () => {
    const content = `
BIASHARA SASA - INVOICE
-----------------------
Invoice ID: ${invoice.id}
Date: ${invoice.date}
Due Date: ${invoice.dueDate}

TRADER DETAILS:
Name: ${invoice.traderName}
Email: ${invoice.traderEmail}

SUBSCRIPTION:
Plan: ${invoice.plan}
Amount: $${invoice.amount}

Status: ${invoice.status.toUpperCase()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${invoice.id}.txt`;
    link.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
        >
          <div className="bg-[#0b2a3e] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold tracking-tight">Onboarding Invoice</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1a4b6d] mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-medium text-sm uppercase tracking-widest mb-1">Invoice Issued</p>
              <h3 className="text-2xl font-black text-[#0b1a2e] mb-1">ID: {invoice.id}</h3>
              <p className="text-slate-400 text-xs">Generated on {invoice.date}</p>
            </div>

            <div className="space-y-4 border-y border-slate-100 py-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Trader</span>
                <span className="text-[#0b1a2e] font-bold">{invoice.traderName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subscription Plan</span>
                <span className="bg-slate-100 px-3 py-0.5 rounded-full text-xs font-bold text-[#1a4b6d] uppercase">{invoice.plan}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-slate-500 font-bold">Amount Due</span>
                <span className="text-3xl font-black text-[#0b1a2e]">${invoice.amount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={onPay}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-[#1a4b6d] to-[#0b2a3e] hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#1a4b6d]/20 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Pay Now
              </button>
            </div>

            <p className="text-center text-slate-400 text-[11px] mt-6 font-medium">
              Payment is required to fully activate the trader account.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
