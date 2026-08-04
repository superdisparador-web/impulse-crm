interface LeadAvatarProps {
  name?: string | null;
  email?: string | null;
  onClick?: () => void;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function show(value?: string | null) {
  return value?.trim() || "—";
}

export default function LeadAvatar({
  name,
  email,
  onClick,
}: LeadAvatarProps) {
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
        {getInitials(name)}
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onClick}
          className="block w-full truncate text-left text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600"
        >
          {show(name)}
        </button>

        <p className="truncate text-xs text-slate-500">
          {show(email)}
        </p>
      </div>
    </div>
  );
}