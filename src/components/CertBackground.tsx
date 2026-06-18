/**
 * Watermark background made of repeating unique-code text — rendered as HTML
 * so web fonts (Oswald) actually apply (SVG background-image can't load web fonts).
 */
export function CertBackground({ code, className = "" }: { code: string; className?: string }) {
  const line = `${code} `.repeat(40);
  const lines = Array.from({ length: 80 });
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{
        fontFamily: "Oswald, 'Helvetica Neue', Arial, sans-serif",
        fontWeight: 800,
        fontSize: "13px",
        lineHeight: "15px",
        letterSpacing: "0.5px",
        color: "#000",
        opacity: 0.11,
        whiteSpace: "nowrap",
        userSelect: "none",
        WebkitTextStroke: "0.3px #000",
      }}
    >
      {lines.map((_, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
