import type { StatusTone } from "@/lib/admin/status-tone";

interface StatusChipProps {
  label: string;
  tone: StatusTone;
  className?: string;
  variant?: "pill" | "text";
}

export function StatusChip({ label, tone, className, variant = "pill" }: StatusChipProps) {
  return (
    <span
      data-status-tone={tone}
      className={`${
        variant === "text" ? "admin-status-text admin-status-text--tone" : "admin-status-pill admin-status-pill--tone"
      } ${className ?? ""}`.trim()}
    >
      {variant === "pill" ? <span className="admin-status-dot" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
