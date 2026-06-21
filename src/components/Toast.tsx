import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}
            className={`
              pointer-events-auto
              flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl min-w-[280px]
              backdrop-blur-md border border-white/10 text-white font-medium
              ${toast.type === 'success' ? 'bg-emerald-600' : ''}
              ${toast.type === 'error' ? 'bg-red-600' : ''}
              ${toast.type === 'info' ? 'bg-[#1e3a6f]' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            
            <span className="flex-1">{toast.message}</span>
            
            <button 
              onClick={() => onRemove(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
