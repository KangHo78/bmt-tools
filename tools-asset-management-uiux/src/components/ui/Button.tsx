import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-canvas hover:bg-ink/85 border border-ink",
  secondary: "bg-amber text-amber-ink hover:bg-amber/85 border border-amber",
  danger: "bg-red text-white hover:bg-red/85 border border-red",
  ghost: "bg-transparent text-ink hover:bg-ink/5 border border-transparent",
  outline: "bg-surface text-ink hover:bg-canvas border border-line",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  fullWidth,
  className = "",
  children,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`tap-target inline-flex items-center justify-center rounded font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  icon,
  fullWidth,
  className = "",
  children,
}: BaseProps & { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`tap-target inline-flex items-center justify-center rounded font-semibold transition-colors duration-150 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {icon}
      {children}
    </Link>
  );
}
