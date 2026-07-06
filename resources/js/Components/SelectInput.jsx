import React from 'react';

export default function SelectInput({ id, name, value, onChange, className = '', children, required = false, ...props }) {
    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-700 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}
