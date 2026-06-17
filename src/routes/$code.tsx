import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCertificateByCode, type Certificate } from "@/lib/certificates";
import { generateQrWithLogo } from "@/lib/qr";
import { CertBackground } from "@/components/CertBackground";
import entrupyLogo from "@/assets/entrupy-logo.png.asset.json";
import verifiedSeal from "@/assets/verified-seal.jpg.asset.json";

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

  return <Certificate cert={data} />;
}

function Certificate({ cert }: { cert: Certificate }) {
  const [activeImg, setActiveImg] = useState(0);
  const [qrUrl, setQrUrl] = useState<string>("");
  const certUrl = typeof window !== "undefined" ? `${window.location.origin}/${cert.code}` : `/${cert.code}`;

  useEffect(() => {
    generateQrWithLogo(certUrl, 400).then(setQrUrl).catch(() => {});
  }, [certUrl]);

  const issuedAt = formatIssuedAt(cert.issued_at);
  const mainImg = cert.images[activeImg] ?? cert.images[0];

  const displayUrl = typeof window !== "undefined"
    ? `${window.location.host}/${cert.code}`
    : `domain/${cert.code}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Outer gold border frame — squared corners */}
      <div className="mx-auto max-w-[1200px] px-3 py-4 md:px-6 md:py-8">
        <div className="relative border-[10px] border-[#c89224] bg-[#f4f3ef] md:border-[14px]">
          {/* watermark fills entire frame to inner edge of outer border */}
          <div className="absolute inset-0 overflow-hidden">
            <CertBackground code={cert.code} />
          </div>
          {/* inner thin border */}
          <div className="relative m-1.5 border border-[#c89224]/70 md:m-2">
            <div className="relative p-4 md:p-8">

              {/* Header */}
              <div className="relative z-10 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
                <img src={entrupyLogo.url} alt="entrupy" className="h-14 md:h-20 object-contain" />
                <h1
                  className="text-center text-2xl tracking-tight md:text-[34px]"
                  style={{ fontFamily: "'Times New Roman', Georgia, serif", fontWeight: 400, letterSpacing: "0.04em" }}
                >
                  CERTIFICATE OF AUTHENTICITY
                </h1>
                <img
                  src={verifiedSeal.url}
                  alt="Verified"
                  className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover"
                />
              </div>

              {/* Body */}
              <div className="relative z-10 mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-2 md:gap-10">
                {/* Left: images */}
                <div>
                  <div className="aspect-square w-full overflow-hidden bg-neutral-200">
                    {mainImg ? (
                      <div className="relative h-full w-full">
                        <img src={mainImg} alt="product" className="h-full w-full object-cover" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-2xl font-bold text-white/70 md:text-4xl">
                          {cert.code}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-neutral-500">No image</div>
                    )}
                  </div>
                  {cert.images.length > 1 && (
                    <div className="mt-3 flex gap-2">
                      {cert.images.map((src, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`h-16 w-16 overflow-hidden border-2 ${i === activeImg ? "border-[#c89224]" : "border-transparent"}`}
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
                    <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#c89224] text-[10px] font-bold text-white">✓</span>
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
                </div>
              </div>

              {/* Notices + QR */}
              <div className="relative z-10 mt-8 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                <div className="space-y-3 text-[11px] leading-snug text-neutral-800 md:text-xs">
                  <p>
                    Trust only the certificates that are hosted on{" "}
                    <a className="text-[#0a66c2] underline" href="#">entrupy.com</a>. Certificates displayed or distributed
                    without Entrupy's authorization are considered invalid as per Entrupy's Terms of Service.
                  </p>
                  <hr className="border-black/40" />
                  <p>
                    Entrupy provides a financial guarantee for this certificate. For more information, visit{" "}
                    <a className="text-[#0a66c2] underline" href="#">entrupy.com/guarantee</a>
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
                <div className="flex flex-col items-center md:items-end">
                  <p className="mb-2 text-center text-xs text-neutral-700 md:hidden">
                    Scan the QR code to verify the<br />authenticity of the certificate.
                  </p>
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR" className="h-40 w-40 md:h-32 md:w-32" />
                  ) : (
                    <div className="h-40 w-40 animate-pulse bg-neutral-200 md:h-32 md:w-32" />
                  )}
                  <p className="mt-2 hidden text-center text-[11px] text-neutral-700 md:block md:max-w-[140px]">
                    Scan the QR code to verify the authenticity of the certificate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 pb-8">
          <button onClick={() => window.print()} className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white">PRINT</button>
          <button
            onClick={() => {
              if (navigator.share) navigator.share({ url: certUrl, title: `Entrupy ${cert.code}` }).catch(() => {});
              else navigator.clipboard.writeText(certUrl);
            }}
            className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white"
          >SHARE</button>
          <button className="rounded-full bg-[#d59824] px-8 py-3 text-sm font-bold text-black">PROTECT YOUR PURCHASE</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-300/70 bg-white/70 px-3 py-2.5">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right text-neutral-900">{children}</span>
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
