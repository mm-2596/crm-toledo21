import Image from "next/image";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AgentAvatar({
  name,
  photoUrl,
  size = 96,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-full bg-paper-dim ${className}`}
        style={{ width: size, height: size }}
      >
        <Image src={photoUrl} alt={name} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-ink font-display text-gold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
