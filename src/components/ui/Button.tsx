import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";

  const styles =
    variant === "primary"
      ? "bg-accent-lavender text-[#141327] shadow-lg shadow-[#8f7ff0]/30 hover:bg-[#a794f5] hover:shadow-xl hover:shadow-[#8f7ff0]/40 hover:-translate-y-0.5"
      : "border border-border-soft text-text-muted hover:text-text-primary hover:border-accent-lavender/60";

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
