import { supabase } from "@/integrations/supabase/client";

export type Certificate = {
  id: string;
  code: string;
  holder: string;
  brand: string;
  material: string;
  identifier: string;
  issued_at: string;
  images: string[];
  created_at: string;
  updated_at: string;
};

export function generateCode(len = 6): string {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function uploadProductImage(file: File, code: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${code}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  // 100 years expiry — effectively permanent signed URL
  const { data, error: sErr } = await supabase.storage
    .from("products")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 100);
  if (sErr) throw sErr;
  return data.signedUrl;
}

export async function listCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Certificate[];
}

export async function getCertificateByCode(code: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as Certificate) ?? null;
}

export async function createCertificate(input: {
  code: string;
  holder: string;
  brand: string;
  material: string;
  identifier: string;
  issued_at: string;
  images: string[];
}): Promise<Certificate> {
  const { data, error } = await supabase
    .from("certificates")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Certificate;
}

export async function updateCertificate(
  id: string,
  patch: Partial<Omit<Certificate, "id" | "created_at" | "updated_at">>,
): Promise<Certificate> {
  const { data, error } = await supabase
    .from("certificates")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Certificate;
}

export async function deleteCertificate(id: string): Promise<void> {
  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) throw error;
}
