
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  holder TEXT NOT NULL DEFAULT 'Entrupy',
  brand TEXT NOT NULL,
  material TEXT NOT NULL,
  identifier TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public can create certificates" ON public.certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update certificates" ON public.certificates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete certificates" ON public.certificates FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for products bucket
CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Public can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products');
CREATE POLICY "Public can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'products');
CREATE POLICY "Public can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'products');
