"use client";

const AVATARS = [
  "⚽","🏆","🥇","🥈","🥉","🎯","🦁","🐯","🦊","🐺",
  "🦅","🦉","🦋","🌟","💥","🔥","⚡","🎲","🃏","👑",
  "🍀","🎖️","🏅","🎪",
];

export function AvatarPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (a: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-foreground/50 mb-2">Escolha seu avatar</p>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            disabled={disabled}
            onClick={() => onChange(a)}
            className={`text-2xl rounded-lg p-1 transition border-2 ${
              value === a
                ? "border-pitch bg-pitch/10 scale-110"
                : "border-transparent hover:border-pitch/30 hover:bg-pitch/5"
            } disabled:opacity-50`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
