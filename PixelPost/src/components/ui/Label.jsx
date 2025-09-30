import React from 'react';

export default function Label({ children, className = '', ...props }) {
  return (
    <label className={`font-semibold text-slate-200 block mb-2 ${className}`} {...props}>
      {children}
    </label>
  );
}
