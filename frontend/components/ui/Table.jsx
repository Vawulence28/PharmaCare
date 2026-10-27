import React from 'react';

export function Table({ headers, children, className = '' }) {
  return (
    <div className={`overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-3">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}