"use client";

import { InputHTMLAttributes } from "react";

export function PillField({
  label,
  hint,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-text-primary font-medium">
        {label}
        {hint && <span className="block text-xs text-text-faint font-normal mt-0.5">{hint}</span>}
      </span>
      <input
        className={`w-full sm:w-40 rounded-full bg-bg-panel-2 border border-border-soft px-4 py-2 text-sm text-text-primary placeholder:text-text-faint outline-none transition-colors focus:border-accent-lavender ${className}`}
        {...rest}
      />
    </label>
  );
}
