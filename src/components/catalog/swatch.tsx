import { colorSwatch, type ColorKey } from "@/data/catalog";

/** Round colour chip. "clear" shows a glass look, "multi" a colour wheel. */
export function Swatch({ color, className = "" }: { color: ColorKey; className?: string }) {
  const fill = colorSwatch[color];
  const style =
    fill === "conic"
      ? { backgroundImage: "conic-gradient(#e9b8b0, #f2cf5b, #8fc1a9, #7aa7d9, #b3261e, #e9b8b0)" }
      : fill === "transparent"
        ? { backgroundImage: "linear-gradient(135deg, #ffffff 45%, #dfe8ee 45%, #dfe8ee 55%, #ffffff 55%)" }
        : { backgroundColor: fill };

  return <span className={`inline-block shrink-0 rounded-full border border-ink/15 ${className}`} style={style} />;
}
