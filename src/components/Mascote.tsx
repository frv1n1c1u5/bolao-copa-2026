import Image from "next/image";

type Pose = "feliz" | "triste" | "comemorando" | "pensando";

const FALLBACK: Record<Pose, string> = {
  feliz: "😄",
  triste: "😢",
  comemorando: "🎉",
  pensando: "🤔",
};

export function Mascote({ pose, size = 80 }: { pose: Pose; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative select-none">
      <Image
        src={`/mascote/${pose}.png`}
        alt={`mascote ${pose}`}
        width={size}
        height={size}
        className="object-contain drop-shadow-md"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fb = e.currentTarget.nextSibling as HTMLSpanElement | null;
          if (fb) fb.style.display = "block";
        }}
      />
      <span
        className="hidden absolute inset-0 flex items-center justify-center"
        style={{ fontSize: size * 0.7 }}
        aria-hidden
      >
        {FALLBACK[pose]}
      </span>
    </div>
  );
}
