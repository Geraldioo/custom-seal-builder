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

  // Center logo on top of white circular plate
  const logoSize = Math.round(size * 0.22);
  const cx = size / 2;
  const cy = size / 2;
  const r = logoSize / 2 + 6;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);

  return canvas.toDataURL("image/png");
}
