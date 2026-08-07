"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}

        <select
          ref={ref}
          {...props}
          className={`
            w-full
            rounded-xl
            border
            border-slate-200
            bg-slate-50/70
            px-4
            py-3
            text-slate-900
            shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)]
            outline-none
            transition-all
            focus:border-blue-600
            focus:bg-white
            focus:ring-4
            focus:ring-blue-100
            ${error ? "border-red-500" : ""}
            ${className}
          `}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
