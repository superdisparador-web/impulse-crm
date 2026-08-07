"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}

        <input
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
            transition-all
            outline-none
            placeholder:text-slate-400
            focus:border-blue-600
            focus:bg-white
            focus:ring-4
            focus:ring-blue-100
            ${error ? "border-red-500" : ""}
            ${className}
          `}
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
