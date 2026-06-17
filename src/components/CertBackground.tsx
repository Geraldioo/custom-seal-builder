/**
 * Watermark background made of repeating unique-code text — small, dense, gap-less.
 */
export function CertBackground({ code, className = "" }: { code: string; className?: string }) {
  const text = `${code}`.repeat(60);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='18'>
    <text x='0' y='13' font-family='Arial, sans-serif' font-weight='700'
      font-size='11' fill='#000' fill-opacity='0.09' letter-spacing='0.5'>${text}</text>
  </svg>`;
  const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: url,
        backgroundRepeat: "repeat",
        backgroundSize: "600px 18px",
      }}
    />
  );
}
