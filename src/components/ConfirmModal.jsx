import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect } from "react";

/**
 * ConfirmModal — Reusable confirmation dialog with glassmorphism style.
 *
 * Props:
 *  - isOpen: boolean
 *  - title: string
 *  - message: ReactNode
 *  - confirmText: string (default: "Xác nhận")
 *  - cancelText: string (default: "Huỷ")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - isDangerous: boolean (if true, confirm button is red, default: false)
 *  - isLoading: boolean (if true, shows spinner on confirm button)
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Huỷ",
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
}) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg-base/60 backdrop-blur-sm transition-opacity" 
        onClick={!isLoading ? onCancel : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-3xl border border-border bg-bg-base/90 p-6 text-left align-middle shadow-2xl shadow-black/50 backdrop-blur-xl transition-all">
        {/* Glow effect */}
        <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-20 ${isDangerous ? 'bg-rose-500' : 'bg-primary-500'}`} />

        <div className="relative flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${isDangerous ? 'border-rose-500/20 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-primary-500/20 bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'}`}>
              <AlertTriangle className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="pt-1.5">
              <h3 className="text-lg font-semibold leading-none tracking-tight text-text-base">
                {title}
              </h3>
              <div className="mt-2 text-sm text-text-muted">
                {message}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="inline-flex justify-center rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-text-base transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-70 ${
                isDangerous
                  ? "bg-rose-400 hover:bg-rose-500 focus-visible:ring-rose-500"
                  : "bg-primary-400 hover:bg-primary-500 focus-visible:ring-primary-500"
              }`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
