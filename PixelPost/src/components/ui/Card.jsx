import React from 'react';

export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-slate-800 rounded-2xl shadow-xl border-t border-b border-slate-700 p-8 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
