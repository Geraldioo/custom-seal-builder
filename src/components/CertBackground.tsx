/**
 * Watermark background made of repeating unique-code text — rendered as HTML
 * so web fonts (Oswald) actually apply (SVG background-image can't load web fonts).
 */
export function CertBackground({ code, className = "" }: { code: string; className?: string }) {
  const line = `${code} `.repeat(40);
  const lines = Array.from({ length: 110 });
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        fontWeight: 700,
        fontSize: "13px",
        lineHeight: "13px",
        letterSpacing: "0px",
        color: "#d9d9d9",
        opacity: 1,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {lines.map((_, i) => (
        <div key={i} style={{ margin: 0, padding: 0 }}>{line}</div>
      ))}
    </div>
  );
}
