-- Execute no SQL Editor do Supabase ANTES de publicar o backend.
-- As fotos de capa existentes permanecem em imagem_url.
BEGIN;
ALTER TABLE public.noticias
  ADD COLUMN IF NOT EXISTS imagens_urls json NOT NULL DEFAULT '[]'::json;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'noticias'
      AND column_name = 'imagens_urls' AND data_type = 'json'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'Coluna imagens_urls divergente: esperado json NOT NULL';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.noticias'::regclass
      AND conname = 'noticias_imagens_urls_array'
  ) THEN
    ALTER TABLE public.noticias ADD CONSTRAINT noticias_imagens_urls_array
      CHECK (json_typeof(imagens_urls) = 'array');
  END IF;
END $$;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
-- A aplicação usa o papel proprietário do banco, conforme DEPLOYMENT.md.
-- Não concede acesso direto pela API do Supabase.
REVOKE ALL ON TABLE public.noticias FROM anon, authenticated;
REVOKE ALL ON TABLE public.noticias FROM PUBLIC;
COMMIT;

-- Verificação pós-migração: fotos antigas preservadas e galeria inicial vazia.
SELECT id, imagem_url, imagens_urls, json_array_length(imagens_urls) AS fotos_extras
FROM public.noticias ORDER BY id;
SELECT relrowsecurity FROM pg_class WHERE oid = 'public.noticias'::regclass;
-- Não são necessários novos índices nem chaves estrangeiras para a lista de URLs.
