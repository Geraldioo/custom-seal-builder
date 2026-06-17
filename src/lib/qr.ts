import QRCode from "qrcode";
import entrupyE from "@/assets/entrupy-e-new.png.asset.json";

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

  // Center logo on a round white plate
  const logoSize = Math.round(size * 0.22);
  const cx = size / 2;
  const cy = size / 2;
  const pad = 8;
  const plateRadius = logoSize / 2 + pad;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, plateRadius, 0, Math.PI * 2);
  ctx.fill();

  // Clip logo to circle for a fully round look
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

