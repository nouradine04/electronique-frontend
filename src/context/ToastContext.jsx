import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => onRemove(toast.id), 300); // Wait for animation
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={20} />,
          bg: 'var(--success-bg)',
          color: 'var(--success)',
          border: 'rgba(16, 185, 129, 0.3)',
          glow: 'rgba(16, 185, 129, 0.2)'
        };
      case 'danger':
        return {
          icon: <XCircle size={20} />,
          bg: 'var(--danger-bg)',
          color: 'var(--danger)',
          border: 'rgba(239, 68, 68, 0.3)',
          glow: 'rgba(239, 68, 68, 0.2)'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          bg: 'var(--warning-bg)',
          color: 'var(--warning)',
          border: 'rgba(245, 158, 11, 0.3)',
          glow: 'rgba(245, 158, 11, 0.2)'
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} />,
          bg: 'var(--info-bg)',
          color: 'var(--info)',
          border: 'rgba(59, 130, 246, 0.3)',
          glow: 'rgba(59, 130, 246, 0.2)'
        };
    }
  };

  const style = getTypeStyles(toast.type);

  return (
    <div style={{
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      backgroundColor: 'var(--bg-surface)',
      border: `1px solid ${style.border}`,
      borderRadius: '16px',
      boxShadow: `0 8px 24px -8px ${style.glow}, var(--shadow-md)`,
      transform: isClosing ? 'translateX(120%)' : 'translateX(0)',
      opacity: isClosing ? 0 : 1,
      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      position: 'relative',
      overflow: 'hidden',
      maxWidth: '350px'
    }}>
      {/* Subtle background glow based on type */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: style.bg, opacity: 0.5, zIndex: 0 }} />
      
      {/* Icon */}
      <div style={{ color: style.color, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {style.icon}
      </div>

      {/* Message */}
      <div style={{ zIndex: 1, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, flex: 1 }}>
        {toast.message}
      </div>

      {/* Close Button */}
      <button 
        onClick={handleClose}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px', borderRadius: '50%', transition: 'background-color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <X size={16} />
      </button>

      {/* Progress Bar (if duration is set) */}
      {toast.duration > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: '3px',
          backgroundColor: style.color,
          animation: `toast-progress ${toast.duration}ms linear forwards`,
          zIndex: 1
        }} />
      )}

      <style>
        {`
          @keyframes toast-progress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
        `}
      </style>
    </div>
  );
}
