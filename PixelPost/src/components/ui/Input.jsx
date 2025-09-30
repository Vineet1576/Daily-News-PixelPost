import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full py-3 px-4 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}
