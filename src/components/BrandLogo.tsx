import React from 'react';
import logo from '../assets/logo.png';
import './brand-logo.css';

export function BrandLogo({ className = '' }: { className?: string }) {
  return <span className={`brand-logo ${className}`}><img src={logo} alt="NStock" /></span>;
}
