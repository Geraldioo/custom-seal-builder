import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCertificate,
  deleteCertificate,
  generateCode,
  listCertificates,
  updateCertificate,
  uploadProductImage,
  type Certificate,
} from "@/lib/certificates";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Certificate Admin" },
      { name: "description", content: "Create and manage certificates of authenticity." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["certs"],
    queryFn: listCertificates,
  });

  const [editing, setEditing] = useState<Certificate | null>(null);
  const [showForm, setShowForm] = useState(false);

  const del = useMutation({
    mutationFn: deleteCertificate,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["certs"] });
    },
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Toaster richColors position="top-center" />
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Certificate Admin</h1>
            <p className="text-xs text-neutral-500">Create and manage certificates of authenticity.</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="rounded-full bg-[#d59824] px-5 py-2 text-sm font-bold text-black"
          >
            + New Certificate
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {showForm && (
          <CertForm
            initial={editing}
            onClose={() => setShowForm(false)}
            onSaved={(c) => {
              setShowForm(false);
              qc.invalidateQueries({ queryKey: ["certs"] });
              toast.success(editing ? "Updated" : "Created");
              if (!editing) router.navigate({ to: "/$code", params: { code: c.code } });
            }}
          />
        )}

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Certificates</h2>
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : certs.length === 0 ? (
          <div className="rounded border border-dashed bg-white p-8 text-center text-sm text-neutral-500">
            No certificates yet. Click "New Certificate" to create one.
          </div>
        ) : (
          <div className="grid gap-3">
            {certs.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded border bg-white p-3">
                <div className="h-16 w-16 overflow-hidden rounded bg-neutral-100">
                  {c.images[0] && <img src={c.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-sm font-bold">{c.code}</div>
                  <div className="text-sm text-neutral-700">{c.brand} — {c.material}</div>
                  <div className="text-xs text-neutral-500">ID: {c.identifier}</div>
                </div>
                <div className="flex gap-2">
                  <Link to="/$code" params={{ code: c.code }} className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">View</Link>
                  <button onClick={() => { setEditing(c); setShowForm(true); }} className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">Edit</button>
                  <button onClick={() => { if (confirm("Delete this certificate?")) del.mutate(c.id); }} className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CertForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Certificate | null;
  onClose: () => void;
  onSaved: (c: Certificate) => void;
}) {
  const [code, setCode] = useState(initial?.code ?? generateCode());
  const [holder, setHolder] = useState(initial?.holder ?? "Entrupy");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [material, setMaterial] = useState(initial?.material ?? "");
  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [issuedAt, setIssuedAt] = useState(
    initial ? new Date(initial.issued_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadProductImage(f, code);
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls]);
      toast.success(`Uploaded ${urls.length} image(s)`);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!brand || !material || !identifier) {
      toast.error("Fill in brand, material, identifier");
      return;
    }
    if (images.length === 0) {
      toast.error("Upload at least one product image");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        holder,
        brand,
        material,
        identifier,
        issued_at: new Date(issuedAt).toISOString(),
        images,
      };
      const result = initial
        ? await updateCertificate(initial.id, payload)
        : await createCertificate(payload);
      onSaved(result);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{initial ? "Edit Certificate" : "New Certificate"}</h3>
        <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-black">Close</button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Unique Code (URL)">
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={input} />
            <button type="button" onClick={() => setCode(generateCode())} className="rounded border px-3 text-xs">Generate</button>
          </div>
          <p className="mt-1 text-xs text-neutral-500">URL: /{code}</p>
        </Field>
        <Field label="Certificate Holder">
          <input value={holder} onChange={(e) => setHolder(e.target.value)} className={input} />
        </Field>
        <Field label="Brand">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={input} placeholder="Louis Vuitton" />
        </Field>
        <Field label="Material">
          <input value={material} onChange={(e) => setMaterial(e.target.value)} className={input} placeholder="Monogram Canvas" />
        </Field>
        <Field label="Identifier">
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={input} placeholder="DK2158" />
        </Field>
        <Field label="Issued At">
          <input type="datetime-local" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className={input} />
        </Field>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-neutral-600">Product Images</label>
        <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-1 block w-full text-sm" />
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded border">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute right-0 top-0 bg-black/70 px-1 text-xs text-white">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={busy} className="rounded bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "Saving…" : initial ? "Save changes" : "Create certificate"}
        </button>
      </div>
    </form>
  );
}

const input = "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-black";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
