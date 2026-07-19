"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}

        <input
          ref={ref}
          {...props}
          className={`
            w-full
            rounded-lg
            border
            border-slate-700
            bg-slate-800
            px-4
            py-3
            text-white
            outline-none
            transition
            placeholder:text-slate-500
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            ${error ? "border-red-500" : ""}
            ${className}
          `}
        />

        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;