import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Toast as ToastType } from '../hooks/useToast';

interface Props {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-200',
  error: 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-200',
  info: 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200',
  warning: 'bg-amber-50 border-amber-400 text-amber-800 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-200',
};

export default function Toast({ toasts, removeToast }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in ${styles[toast.type]}`}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
