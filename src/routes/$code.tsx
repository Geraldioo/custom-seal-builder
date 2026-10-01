import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCertificateByCode, type Certificate } from "@/lib/certificates";
import { generateQrWithLogo } from "@/lib/qr";
import { CertBackground } from "@/components/CertBackground";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Facebook, Twitter, Linkedin, Search, Info } from "lucide-react";
import entrupyLogo from "@/assets/entrupy-text.png.asset.json";
import verifiedSeal from "@/assets/verified-seal-new.png.asset.json";
import checkmarkBadge from "@/assets/checkmark-badge.png.asset.json";

type PrintSize = "a4" | "letter" | "mobile";

export const Route = createFileRoute("/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.code} — Certificate of Authenticity` },
      { name: "description", content: `Entrupy certificate of authenticity ${params.code}` },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { code } = Route.useParams();
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["cert", code],
    queryFn: () => getCertificateByCode(code),
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }
  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-red-600">Failed to load.</div>;
  }
  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-bold">Certificate not found</h1>
        <p className="text-sm text-neutral-600">Code <span className="font-mono">{code}</span> doesn't exist.</p>
        <button onClick={() => router.navigate({ to: "/" })} className="mt-2 rounded bg-black px-4 py-2 text-sm text-white">Go home</button>
      </div>
    );
  }

  // Check for printable mode with mobile size — use dedicated layout
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search);
    if (p.get("format") === "printable" && p.get("size") === "mobile") {
      return <MobilePrintCertificate cert={data} />;
    }
  }
  return <Certificate cert={data} />;
}

function Certificate({ cert }: { cert: Certificate }) {
  const [activeImg, setActiveImg] = useState(0);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [shareOpen, setShareOpen] = useState(false);
  const [protectOpen, setProtectOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printSize, setPrintSize] = useState<PrintSize>("letter");
  const [copied, setCopied] = useState(false);
  const certUrl = `https://entrupy.web.id/${cert.code}`;
  const shareUrl = `${certUrl}?format=sharable&locale=en`;

  // Read URL params for printable mode
  const { isPrintable, forcedSize } = useMemo(() => {
    if (typeof window === "undefined") return { isPrintable: false, forcedSize: null as PrintSize | null };
    const p = new URLSearchParams(window.location.search);
    const fmt = p.get("format");
    const sz = p.get("size") as PrintSize | null;
    return {
      isPrintable: fmt === "printable",
      forcedSize: sz === "a4" || sz === "letter" || sz === "mobile" ? sz : null,
    };
  }, []);

  const wantMobile = forcedSize === "mobile";
  const forced = isPrintable && !!forcedSize;

  useEffect(() => {
    generateQrWithLogo(certUrl, 400).then(setQrUrl).catch(() => {});
  }, [certUrl]);

  // In printable mode: set filename to {code}.pdf via document.title, then auto-print
  useEffect(() => {
    if (!isPrintable) return;
    const prevTitle = document.title;
    document.title = cert.code;
    const t = setTimeout(() => {
      try { window.print(); } catch {}
    }, 1200);
    return () => { clearTimeout(t); document.title = prevTitle; };
  }, [isPrintable, cert.code, qrUrl]);

  const issuedAt = formatIssuedAt(cert.issued_at);
  const mainImg = cert.images[activeImg] ?? cert.images[0];
  const displayUrl = `cert.entrupy.com/${cert.code}`;

  const openPrint = () => {
    const url = `${window.location.origin}/${cert.code}?format=printable&size=${printSize}`;
    window.open(url, "_blank", "noopener");
    setPrintOpen(false);
  };

  // Layout class helpers
  const mobileBlockCls = forced ? (wantMobile ? "" : "hidden") : "md:hidden";
  const desktopFlexCls = forced ? (wantMobile ? "hidden" : "flex items-center justify-between gap-8") : "hidden md:flex md:items-center md:justify-between md:gap-8";
  const bodyGridCls = forced
    ? (wantMobile ? "grid grid-cols-1 gap-6" : "grid grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-10")
    : "grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-10";
  const footerGridCls = forced
    ? (wantMobile ? "grid grid-cols-1 gap-6" : "grid grid-cols-[1fr_auto] gap-6")
    : "grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]";
  const qrCaptionMobileCls = forced ? (wantMobile ? "" : "hidden") : "md:hidden";
  const qrCaptionDesktopCls = forced
    ? (wantMobile ? "hidden" : "block text-center text-[11px] text-neutral-700 max-w-[140px]")
    : "hidden text-center text-[11px] text-neutral-700 md:block md:max-w-[140px]";
  const titleMobileCls = forced ? (wantMobile ? "block" : "hidden") : "md:hidden";
  const containerMaxW = forced
    ? (wantMobile ? "max-w-[440px]" : "max-w-[1200px]")
    : "max-w-[1200px]";

  const pageSizeCss = forcedSize === "a4" ? "A4" : forcedSize === "letter" ? "letter" : "105mm 170mm";

  return (
    <div className="min-h-screen bg-white">
      {isPrintable && (
        <style>{`
          @page { size: ${pageSizeCss}; margin: 0; }
          @media print {
            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-page { width: 100vw; min-height: 100vh; }
          }
          .print-page { width: 100vw; min-height: 100vh; box-sizing: border-box; padding: 4mm; }
          .print-card { min-height: calc(100vh - 8mm); display: flex; flex-direction: column; }
          .print-card > .print-inner { flex: 1; display: flex; flex-direction: column; }
        `}</style>
      )}

      {/* Outer gold border frame — squared corners */}
      <div className={`mx-auto ${containerMaxW} ${isPrintable ? "print-page" : "px-3 py-4 md:px-6 md:py-8"}`}>
        <div className={`relative border-[#daa520] bg-[#f4f3ef] ${isPrintable ? "border-[8px] print-card" : "border-[10px] md:border-[14px]"}`}>
          {/* watermark */}
          <div className="absolute inset-0 overflow-hidden">
            <CertBackground code={cert.code} />
          </div>
          {/* inner thin border */}
          <div className={`relative m-1.5 border-2 border-[#daa520]/80 md:m-2 ${isPrintable ? "print-inner" : ""}`}>
            <div className={`relative p-4 md:p-8 ${isPrintable ? "flex-1 flex flex-col" : ""}`}>

              {/* Header */}
              <div className="relative z-10 pt-3 md:pt-5">
                {/* Mobile-style: logo + seal one row, title centered below */}
                <div className={`flex items-center justify-between ${mobileBlockCls}`}>
                  <img src={entrupyLogo.url} alt="entrupy" className="h-12 object-contain" />
                  <img
                    src={verifiedSeal.url}
                    alt="Verified"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <h1
                  className={`mt-5 text-center text-[42px] leading-none ${titleMobileCls}`}
                  style={{ fontFamily: "'Bebas Neue', 'Oswald', Arial, sans-serif", fontWeight: 400, letterSpacing: "0.02em" }}
                >
                  CERTIFICATE OF AUTHENTICITY
                </h1>

                {/* Desktop-style: single row */}
                <div className={desktopFlexCls}>
                  <img src={entrupyLogo.url} alt="entrupy" className="h-20 object-contain" />
                  <h1
                    className="flex-1 whitespace-nowrap px-8 text-center text-[48px] leading-none"
                    style={{ fontFamily: "'Bebas Neue', 'Oswald', Arial, sans-serif", fontWeight: 400, letterSpacing: "0.02em" }}
                  >
                    CERTIFICATE OF AUTHENTICITY
                  </h1>
                  <img
                    src={verifiedSeal.url}
                    alt="Verified"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Body */}
              <div className={`relative z-10 mt-6 md:mt-8 ${bodyGridCls}`}>
                {/* Left: images */}
                <div>
                  <div className="@container aspect-square w-full overflow-hidden rounded-xl bg-neutral-200">
                    {mainImg ? (
                      <div className="relative h-full w-full">
                        <img src={mainImg} alt="product" className="h-full w-full object-cover" />
                        <div
                          className="photo-code pointer-events-none absolute inset-x-0 bottom-[6%] text-center text-white/50"
                          style={{ fontFamily: "'Arimo', Arial, sans-serif", fontWeight: 100, letterSpacing: "0.06em", fontSize: "12cqw", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
                        >
                          {cert.code}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-500">No image</div>
                    )}
                  </div>
                  {cert.images.length > 1 && (
                    <div className="mt-3 flex justify-center gap-3">
                      {cert.images.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setActiveImg(i)}
                          onFocus={() => setActiveImg(i)}
                          onClick={() => setActiveImg(i)}
                          className={`h-16 w-16 overflow-hidden rounded-lg border-4 transition hover:border-[#daa520] ${i === activeImg ? "border-[#daa520]" : "border-transparent"}`}
                        >
                          <img src={src} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: data fields */}
                <div className="space-y-3 text-sm md:text-[15px]">
                  <Field label="Certificate Holder">
                    <span className="font-bold">{cert.holder}</span>
                    <img src={checkmarkBadge.url} alt="verified" className="ml-2 inline-block h-4 w-4 align-middle" />
                  </Field>
                  <Field label="Brand"><span className="font-bold">{cert.brand}</span></Field>
                  <Field label="Material"><span className="font-bold">{cert.material}</span></Field>
                  <Field label="Certificate Link">
                    <a href={certUrl} className="break-all font-medium text-[#0a66c2] underline">
                      {displayUrl}
                    </a>
                  </Field>
                  <Field label="Certificate Issued At"><span className="font-bold">{issuedAt}</span></Field>
                  <Field label="Identifier"><span className="font-bold">{cert.identifier}</span></Field>
                  <p className="pt-3 text-[11px] leading-snug text-neutral-800 md:text-xs">
                    Trust only the certificates that are hosted on{" "}
                    <a className="text-[#0a66c2] underline" href="https://entrupy.com">entrupy.com</a>. Certificates displayed or distributed
                    without Entrupy's authorization are considered invalid as per Entrupy's Terms of Service.
                  </p>
                </div>
              </div>

              {/* Notices + QR */}
              <div className={`relative z-10 mt-6 ${footerGridCls} ${isPrintable ? "mt-auto pt-8" : ""}`}>
                <div className="space-y-3 text-[11px] leading-snug text-neutral-800 md:text-xs">
                  <p>
                    Entrupy provides a financial guarantee for this certificate. For more information, visit{" "}
                    <a className="text-[#0a66c2] underline" href="https://entrupy.com/guarantee">entrupy.com/guarantee</a>
                  </p>
                  <p>
                    Entrupy offers additional protection plans through XCover for authenticated goods.{" "}
                    <a className="text-[#0a66c2] underline" href="#">Learn more here.</a>
                  </p>
                  <p>
                    Entrupy is not sponsored by or affiliated with any of the designers listed on the Entrupy website.
                    Entrupy's authentication service is based solely on Entrupy's detection algorithm, and the database
                    relied upon is not based upon data provided by any of the designers listed on the Entrupy website.
                    The designers listed on the Entrupy website or application are neither responsible for nor bound by
                    any of the Entrupy's findings and may not honor any certificates of authenticity provided by Entrupy.
                  </p>
                </div>
                <div className={`flex flex-col ${forced ? (wantMobile ? "items-center" : "items-end") : "items-center md:items-end"}`}>
                  <p className={`mb-2 text-center text-xs text-neutral-700 ${qrCaptionMobileCls}`}>
                    Scan the QR code to verify the<br />authenticity of the certificate.
                  </p>
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR" className={forced ? (wantMobile ? "h-40 w-40" : "h-32 w-32") : "h-40 w-40 md:h-32 md:w-32"} />
                  ) : (
                    <div className={forced ? (wantMobile ? "h-40 w-40 animate-pulse bg-neutral-200" : "h-32 w-32 animate-pulse bg-neutral-200") : "h-40 w-40 animate-pulse bg-neutral-200 md:h-32 md:w-32"} />
                  )}
                  <p className={`mt-2 ${qrCaptionDesktopCls}`}>
                    Scan the QR code to verify the authenticity of the certificate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Footer actions — hidden in printable mode */}
        {!isPrintable && (
          <div className="no-print mt-6 flex flex-col gap-3 pb-8 md:flex-row md:flex-wrap md:justify-center">
            <div className="grid grid-cols-2 gap-3 md:contents">
              <button
                onClick={() => setPrintOpen(true)}
                className="rounded-full border-2 border-black bg-black px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-transparent hover:text-black"
              >PRINT</button>
              <button
                onClick={() => setShareOpen(true)}
                className="rounded-full border-2 border-black bg-black px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-transparent hover:text-black"
              >SHARE</button>
            </div>
            <button
              onClick={() => setProtectOpen(true)}
              className="w-full rounded-full border-2 border-[#daa520] bg-[#daa520] px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-transparent md:w-auto"
            >PROTECT YOUR PURCHASE</button>
          </div>
        )}
      </div>

      {/* Print dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-[560px] gap-0 rounded-2xl border-none p-0 sm:rounded-2xl">
          <div className="px-7 pt-6 pb-4">
            <h2 className="text-xl font-bold text-[#0f2c4a]" style={{ fontFamily: "'Georgia', serif" }}>Print Certificate</h2>
          </div>
          <div className="h-[2px] w-full bg-[#daa520]" />
          <div className="px-7 py-6">
            <p className="text-[15px] font-semibold text-[#0f2c4a]" style={{ fontFamily: "'Georgia', serif" }}>Paper Size:</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {([
                { v: "a4", label: "A4" },
                { v: "letter", label: "US Letter" },
                { v: "mobile", label: "Mobile" },
              ] as const).map((opt) => (
                <label key={opt.v} className="flex cursor-pointer items-center gap-2 text-sm text-[#0f2c4a]">
                  <input
                    type="radio"
                    name="paperSize"
                    checked={printSize === opt.v}
                    onChange={() => setPrintSize(opt.v)}
                    className="h-4 w-4 accent-[#0f2c4a]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={openPrint}
                className="rounded-full bg-[#daa520] px-10 py-3 text-sm font-bold text-black hover:opacity-90"
              >PRINT</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-[560px] gap-0 rounded-2xl border-none p-0 sm:rounded-2xl">
          <div className="px-7 pt-6 pb-4">
            <h2 className="text-xl font-bold text-[#0f2c4a]">Share Certificate</h2>
          </div>
          <div className="h-[2px] w-full bg-[#daa520]" />
          <div className="px-7 py-6">
            <p className="text-[15px] font-semibold text-[#0f2c4a]">Share this link via:</p>
            <div className="mt-5 flex justify-center gap-4">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1877f2] text-white"><Facebook className="h-6 w-6 fill-white" /></a>
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1da1f2] text-white"><Twitter className="h-6 w-6 fill-white" /></a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0a66c2] text-white"><Linkedin className="h-6 w-6 fill-white" /></a>
            </div>
            <p className="mt-6 text-[15px] font-semibold text-[#0f2c4a]">Or copy link:</p>
            <div className="mt-3 flex items-center gap-2 rounded-full border border-neutral-300 bg-white py-1 pl-4 pr-1">
              <span className="flex-1 truncate text-xs text-[#daa520]">{shareUrl}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="rounded-full bg-black px-6 py-2 text-xs font-bold text-white"
              >{copied ? "COPIED" : "COPY"}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Protect dialog */}
      <Dialog open={protectOpen} onOpenChange={setProtectOpen}>
        <DialogContent className="max-w-[640px] gap-0 rounded-2xl border-none p-0 sm:rounded-2xl">
          <div className="px-7 pt-6 pb-4">
            <h2 className="text-2xl font-bold text-[#0f2c4a]">Protection for your Collection</h2>
          </div>
          <div className="h-[2px] w-full bg-[#daa520]" />
          <div className="px-7 py-6">
            <p className="text-sm leading-relaxed text-neutral-800">
              Congratulations on your newly authenticated bag! Authentic luxury goods are treasures that can last a lifetime - get it a protection plan to match.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <img src={entrupyLogo.url} alt="entrupy" className="h-5 object-contain" />
              <span className="text-neutral-400">|</span>
              <span className="text-[11px] text-neutral-500">Powered by</span>
              <span className="text-sm font-bold"><span className="text-[#f5b40a]">X</span>COVER.COM</span>
            </div>
            <h3 className="mt-5 text-[17px] font-bold text-neutral-900">Protect your authenticated handbag with XCover!</h3>
            <p className="mt-1 text-sm text-neutral-800">Search for your handbag's brand &amp; the price range you paid for your handbag.</p>

            <label className="mt-5 block text-sm font-bold text-neutral-900">Product Title or SKU</label>
            <div className="mt-2 flex">
              <input
                type="text"
                placeholder="Search by product title or SKU"
                className="flex-1 rounded-l-md border-2 border-black bg-white px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400"
              />
              <button type="button" className="flex items-center justify-center rounded-r-md border-2 border-l-0 border-black bg-neutral-300 px-4">
                <Search className="h-4 w-4 text-white" />
              </button>
            </div>
            <p className="mt-1 text-xs italic text-neutral-500">(Minimum of 3 characters required)</p>

            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-neutral-900">
              Did you buy your product in the past 30 days? <Info className="h-3.5 w-3.5 text-neutral-400" />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 text-sm">
                <input type="radio" name="purchased30" className="h-4 w-4" /> Yes
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 text-sm">
                <input type="radio" name="purchased30" className="h-4 w-4" /> No
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-neutral-300/70 bg-white/70 px-3 py-2.5 md:grid-cols-[160px_1fr]">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900">{children}</span>
    </div>
  );
}

function MobilePrintCertificate({ cert }: { cert: Certificate }) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const certUrl = `https://entrupy.web.id/${cert.code}`;
  const issuedAt = formatIssuedAt(cert.issued_at);
  const mainImg = cert.images[0];

  useEffect(() => {
    generateQrWithLogo(certUrl, 400).then(setQrUrl).catch(() => {});
  }, [certUrl]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = cert.code;
    const t = setTimeout(() => { try { window.print(); } catch {} }, 1200);
    return () => { clearTimeout(t); document.title = prevTitle; };
  }, [cert.code, qrUrl]);

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @page { size: 105mm 170mm; margin: 4mm; }
        @media print { body { background: white !important; } }
        .mp-title-row { display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between; gap: 12px; container-type: inline-size; }
        .mp-title { white-space: nowrap; min-width: 0; flex: 1 1 auto; font-size: clamp(16px, 8.2cqw, 32px); }
        @media print and (max-width: 767px) {
          .mp-title-row { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; }
          .mp-title { white-space: nowrap !important; font-size: clamp(14px, 8.2cqw, 30px) !important; }
          .mp-seal { flex-shrink: 0 !important; }
        }
      `}</style>
      <div className="mx-auto max-w-[440px] p-2">
        <div className="relative rounded-[14px] border-[8px] border-[#daa520] bg-[#f4f3ef]">
          <div className="absolute inset-0 overflow-hidden rounded-[6px]">
            <CertBackground code={cert.code} />
          </div>
          <div className="relative m-1 rounded-[8px] border border-[#daa520]/70">
            <div className="relative p-4">
              {/* Header */}
              <img src={entrupyLogo.url} alt="entrupy" className="mt-2 h-9 object-contain" />
              <div className="mp-title-row mt-3">
                <h1
                  className="mp-title leading-[1]"
                  style={{ fontFamily: "'Bebas Neue', 'Oswald', Arial, sans-serif", fontWeight: 400, letterSpacing: "0.02em" }}
                >
                  CERTIFICATE OF AUTHENTICITY
                </h1>
                <img src={verifiedSeal.url} alt="Verified" className="mp-seal h-14 w-14 shrink-0 rounded-full object-cover" />
              </div>

              {/* Fields 2-col */}
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-[12px]">
                <MPField label="Certificate Holder" value={cert.holder} />
                <MPField label="Brand" value={cert.brand} />
                <MPField label="Material" value={cert.material} />
                <MPField label="Identifier" value={cert.identifier} />
                <div className="col-span-2">
                  <MPField label="Certificate Issued At" value={issuedAt} />
                </div>
              </div>

              {/* Image + QR */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="@container aspect-square overflow-hidden rounded-lg bg-neutral-200">
                  {mainImg ? (
                    <div className="relative h-full w-full">
                      <img src={mainImg} alt="product" className="h-full w-full object-cover" />
                      <div
                        className="photo-code pointer-events-none absolute inset-x-0 bottom-[6%] text-center text-white/55"
                        style={{ fontFamily: "'Arimo', Arial, sans-serif", fontWeight: 100, letterSpacing: "0.06em", fontSize: "12cqw", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
                      >
                        {cert.code}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="aspect-square overflow-hidden rounded-lg bg-white">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full animate-pulse bg-neutral-200" />
                  )}
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] leading-snug text-neutral-800">
                Scan the QR code to verify the<br />authenticity of the certificate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MPField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-1 text-[13px] font-bold text-neutral-900 break-words">{value}</div>
    </div>
  );
}

function formatIssuedAt(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()} ${hh}:${mm} UTC`;
}
