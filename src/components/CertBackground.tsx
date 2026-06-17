/**
 * Watermark background made of repeating unique-code text.
 * Small, dense lettering tiled across the whole frame.
 */
export function CertBackground({ code, className = "" }: { code: string; className?: string }) {
  const text = `${code} `.repeat(40);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='28'>
    <text x='0' y='20' font-family='Arial, sans-serif' font-weight='700'
      font-size='16' fill='#000' fill-opacity='0.08' letter-spacing='1'>${text}</text>
  </svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: url,
        backgroundRepeat: "repeat",
        backgroundSize: "800px 28px",
      }}
    />
  );
}
