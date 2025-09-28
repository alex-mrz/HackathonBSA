interface VoteButtonProps {
  voteValue: number;
  label: string;
  variant: "pour" | "contre";
}

export function VoteButton({ voteValue: _voteValue, label, variant }: VoteButtonProps) {
  const btnBase =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses =
    variant === "pour"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400"
      : "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-400";

  return (
    <button type="button" className={`${btnBase} ${variantClasses}`}>
      {label}
    </button>
  );
}
