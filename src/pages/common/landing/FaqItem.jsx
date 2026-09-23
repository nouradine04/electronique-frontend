import { useState } from 'react';
import { BRAND } from './constants';

export function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 0',
      cursor: 'pointer'
    }} onClick={() => setIsOpen(!isOpen)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', textAlign: 'left' }}>
          {question}
        </h3>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: BRAND, transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease', display: 'inline-block', lineHeight: 1 }}>
          +
        </span>
      </div>
      {isOpen && (
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, textAlign: 'left', marginTop: '10px' }}>
          {answer}
        </p>
      )}
    </div>
  );
}
