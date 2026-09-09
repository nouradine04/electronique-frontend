import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { LoaderCircle, Check, Circle, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './form-ui.css';

export function LoadingButton({ loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return <button {...props} disabled={loading || props.disabled} aria-busy={loading || undefined}>
    {loading && <LoaderCircle className="form-spinner" size={18} aria-hidden="true" />}
    <span>{loading ? 'Veuillez patienter…' : children}</span>
  </button>;
}

export function StepProgress({ step, total, items, onSelect }: { step: number; total: number; items?: { label: string; icon: LucideIcon }[]; onSelect?: (step: number) => void }) {
  return <ol className="form-progress" aria-label={`Étape ${step} sur ${total}`}>
    {Array.from({ length: total }, (_, index) => {
      const Icon = index + 1 < step ? Check : items?.[index]?.icon || Circle;
      return <li key={index} className={index + 1 <= step ? 'reached' : ''} aria-current={index + 1 === step ? 'step' : undefined}><button type="button" disabled={!onSelect || index + 1 >= step} onClick={() => onSelect?.(index + 1)}><span className="progress-icon"><Icon size={20} /></span><span>{items?.[index]?.label || `Étape ${index + 1}`}</span></button></li>;
    })}
  </ol>;
}

export function FormStep({ stepKey, children }: { stepKey: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  return <AnimatePresence mode="wait"><motion.div key={stepKey} className="form-step" initial={reduced ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -14 }} transition={{ duration: reduced ? 0 : .24 }}>{children}</motion.div></AnimatePresence>;
}
