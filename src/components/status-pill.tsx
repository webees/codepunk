interface StatusPillProps {
  readonly tone: "neutral" | "success" | "danger";
  readonly children: string;
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}
