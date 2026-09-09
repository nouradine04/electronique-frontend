import React, { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import './form-controls.css';

export const FormInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leadingIcon?: ReactNode }>(({ leadingIcon, className = '', ...props }, ref) => (
  <div className={`ui-input-wrap ${className}`}>
    {leadingIcon && <span className="ui-input-icon" aria-hidden="true">{leadingIcon}</span>}
    <input ref={ref} className="ui-input" {...props} />
  </div>
));
FormInput.displayName = 'FormInput';

export const FormSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className = '', children, ...props }, ref) => (
  <div className={`ui-select-wrap ${className}`}>
    <select ref={ref} className="ui-input ui-select" {...props}>{children}</select>
  </div>
));
FormSelect.displayName = 'FormSelect';

export function FormField({ id, label, children, help, error }: { id: string; label: ReactNode; children: ReactNode; help?: ReactNode; error?: ReactNode }) {
  return <div className="ui-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {error ? <p className="ui-field-error" role="alert">{error}</p> : help ? <p className="ui-field-help">{help}</p> : null}
  </div>;
}

export function FormDivider({ children = 'ou' }: { children?: ReactNode }) {
  return <div className="ui-form-divider"><span>{children}</span></div>;
}
