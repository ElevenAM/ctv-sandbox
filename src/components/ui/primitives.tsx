import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/prototypes/types";

/*
  The whole primitive set. One file on purpose: a prototype library is read
  more than it is extended, and five small components across five files costs
  more to scan than it saves.
*/

const TONE_TEXT: Record<Tone, string> = {
  amber: "text-amber",
  iris: "text-iris",
  jade: "text-jade",
  rose: "text-rose",
  slate: "text-slate",
};

const TONE_BG: Record<Tone, string> = {
  amber: "bg-amber",
  iris: "bg-iris",
  jade: "bg-jade",
  rose: "bg-rose",
  slate: "bg-slate",
};

export const toneText = (tone: Tone) => TONE_TEXT[tone];
export const toneBg = (tone: Tone) => TONE_BG[tone];

/* ------------------------------------------------------------------- tag -- */

export function Tag({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "type-index inline-flex items-center rounded-full border border-line px-2.5 py-1 text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- button -- */

type ButtonProps = ComponentProps<"button"> & {
  /** `primary` is the one brand fill on a screen (DESIGN.md §4). Use once. */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90 active:opacity-80",
  secondary:
    "bg-raised text-ink border border-line hover:border-line-strong active:bg-surface",
  ghost: "text-ink-soft hover:text-ink hover:bg-raised active:bg-surface",
  danger: "text-danger border border-line hover:border-danger active:bg-raised",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        // min-h-11 is the 44px touch floor. It is a floor, not a suggestion.
        "type-small inline-flex min-h-11 items-center justify-center gap-2 rounded-[--radius-control] font-medium",
        "transition-[opacity,background-color,border-color,transform] duration-(--duration-fast) ease-(--ease-out-soft)",
        // Every tap acknowledged within one frame (DESIGN.md §5).
        "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "px-3" : "px-4",
        VARIANT[variant],
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------ status dot -- */

export function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="type-index inline-flex items-center gap-1.5 text-ink-muted">
      <span aria-hidden className={cn("size-1.5 rounded-full", toneBg(tone))} />
      {label}
    </span>
  );
}

/* --------------------------------------------------- the four data states -- */
/*
  DESIGN.md §3: loading ≠ empty ≠ filtered-empty ≠ failed. Rendering the
  new-user empty state during a load, or after a failure, is a bug — it tells
  someone with 3,000 rows that they have none. Import these; do not hand-roll
  a fifth variant in a prototype.
*/

export function LoadingState({
  rows = 3,
  label = "Loading",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="flex flex-col gap-3"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="shimmer h-16 rounded-[--radius-card]" />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[--radius-card] border border-dashed border-line px-6 py-10">
      <h3 className="type-heading text-ink">{title}</h3>
      <p className="type-body max-w-prose text-ink-soft">{body}</p>
      {action}
    </div>
  );
}

export function FilteredEmptyState({
  onClear,
  title = "Nothing matches those filters",
  body = "The library is not empty — this combination of filters is. Clear them to see everything.",
  clearLabel = "Clear filters",
}: {
  onClear: () => void;
  title?: string;
  body?: string;
  clearLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[--radius-card] border border-dashed border-line px-6 py-10">
      <h3 className="type-heading text-ink">{title}</h3>
      <p className="type-body text-ink-soft">{body}</p>
      <Button onClick={onClear}>{clearLabel}</Button>
    </div>
  );
}

export function FailedState({
  title = "That did not load",
  body,
  onRetry,
  hint,
}: {
  title?: string;
  /** Human copy. NEVER pass a raw `Result.reason` here — map it first. */
  body: string;
  onRetry?: () => void;
  /** Optional operator-facing fix, e.g. the exact toggle to flip. */
  hint?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-[--radius-card] border border-line bg-raised px-6 py-8"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="size-1.5 rounded-full bg-danger" />
        <h3 className="type-heading text-ink">{title}</h3>
      </div>
      <p className="type-body max-w-prose text-ink-soft">{body}</p>
      {hint ? (
        <div className="type-small max-w-prose text-ink-muted">{hint}</div>
      ) : null}
      {/* In-place retry, never a blocking alert (DESIGN.md §6). */}
      {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}
