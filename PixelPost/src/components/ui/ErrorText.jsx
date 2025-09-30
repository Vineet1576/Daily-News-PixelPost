import React from 'react';

export default function ErrorText({ children, className = '' }) {
  if (!children) return null;
  return (
    <p className={`text-red-500 font-semibold mt-4 text-center text-sm ${className}`}>{children}</p>
  );
}
