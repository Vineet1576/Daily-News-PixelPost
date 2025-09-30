import React from 'react';

export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 hover:bg-blue-700 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
