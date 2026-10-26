import Image from "next/image";

// Logo principal: la casita junto al nombre. Sobre fondo oscuro (la portada) la
// casita, que es negra, se muestra en blanco para que se vea.
export function BrandLogo({
  onDark = false,
  size = "md",
  className = "",
}: {
  onDark?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const house = size === "lg" ? "h-14" : "h-9 sm:h-10";
  const word = size === "lg" ? "h-10" : "h-6 sm:h-7";
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo/toledo21-mascot.png"
        alt=""
        aria-hidden="true"
        width={888}
        height={660}
        className={`${house} w-auto object-contain transition-[filter] duration-300 ${onDark ? "brightness-0 invert" : ""}`}
        priority
      />
      <Image
        src="/logo/toledo21-wordmark.png"
        alt="Toledo21"
        width={634}
        height={174}
        className={`${word} w-auto rounded-[3px] object-contain`}
        priority
      />
    </span>
  );
}
