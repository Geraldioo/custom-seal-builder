import QRCode from "qrcode";
import entrupyE from "@/assets/entrupy-e.png.asset.json";

/**
 * Generate a QR code data URL with the Entrupy "e" logo in the center.
 */
export async function generateQrWithLogo(url: string, size = 512): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: "H",
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const ctx = canvas.getContext("2d")!;

  const logo = new Image();
  logo.crossOrigin = "anonymous";
  logo.src = entrupyE.url;
  await new Promise<void>((res, rej) => {
    logo.onload = () => res();
    logo.onerror = () => rej(new Error("logo load failed"));
  });

  // Center logo on a rounded white plate
  const logoSize = Math.round(size * 0.22);
  const cx = size / 2;
  const cy = size / 2;
  const pad = 8;
  const plate = logoSize + pad * 2;
  const radius = Math.round(plate * 0.28);
  const x = cx - plate / 2;
  const y = cy - plate / 2;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, plate, plate, radius);
  ctx.fill();

  ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);

  return canvas.toDataURL("image/png");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
