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
        fontFamily: "'Courier New', 'Roboto Mono', ui-monospace, monospace",
        fontWeight: 600,
        fontSize: "13px",
        lineHeight: "15px",
        letterSpacing: "1px",
        color: "#9ca3af",
        opacity: 0.45,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {lines.map((_, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
