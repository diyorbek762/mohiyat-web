import React from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type DialogType = 'alert' | 'confirm' | 'prompt';
export type DialogTheme = 'blue' | 'red' | 'green' | 'amber';

interface CustomDialogProps {
  isOpen: boolean;
  type: DialogType;
  theme?: DialogTheme;
  title: string;
  description?: string;
  value?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (val?: string) => void;
  onChange?: (val: string) => void;
}

export default function CustomDialog({
  isOpen, type, theme = 'blue', title, description, value = '', placeholder, confirmText = 'Tasdiqlash', cancelText = 'Bekor qilish', isLoading, onClose, onConfirm, onChange
}: CustomDialogProps) {
  const [internalValue, setInternalValue] = React.useState(value);

  React.useEffect(() => {
    if (isOpen) {
      setInternalValue(value);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  const themes = {
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-blue-600', icon: Info, lightBg: 'bg-blue-50' },
    red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', text: 'text-red-600', icon: AlertCircle, lightBg: 'bg-red-50' },
    green: { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', text: 'text-emerald-600', icon: CheckCircle, lightBg: 'bg-emerald-50' },
    amber: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-500', icon: AlertCircle, lightBg: 'bg-amber-50' },
  };

  const activeTheme = themes[theme];
  const Icon = activeTheme.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-in border border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${activeTheme.lightBg}`}>
          <Icon className={`w-6 h-6 ${activeTheme.text}`} />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        {description && <p className="text-slate-500 text-sm mb-6">{description}</p>}

        {type === 'prompt' && (
          <div className="mb-6">
            <input 
              type="text" 
              value={internalValue} 
              onChange={e => {
                setInternalValue(e.target.value);
                onChange?.(e.target.value);
              }} 
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium text-slate-800"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onConfirm(internalValue);
              }}
            />
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {type !== 'alert' && (
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={() => onConfirm(internalValue)}
            disabled={isLoading || (type === 'prompt' && !internalValue.trim())}
            className={`flex-1 py-3 px-4 ${activeTheme.bg} ${activeTheme.hover} text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
