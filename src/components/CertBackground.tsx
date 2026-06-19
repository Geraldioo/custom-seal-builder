/**
 * Watermark background made of repeating unique-code text — rendered as HTML
 * so web fonts (Oswald) actually apply (SVG background-image can't load web fonts).
 */
export function CertBackground({ code, className = "" }: { code: string; className?: string }) {
  const line = `${code}\u00A0`.repeat(120);
  const lines = Array.from({ length: 140 });
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontWeight: 600,
        fontSize: "12px",
        lineHeight: "12px",
        letterSpacing: "0px",
        color: "#000",
        opacity: 0.06,
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
