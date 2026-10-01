-- Reimplante a versão anterior do código antes deste rollback.
-- Interrompe se houver fotos extras, para impedir perda de dados.
BEGIN;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'noticias' AND column_name = 'imagens_urls'
  ) THEN
    IF EXISTS (SELECT 1 FROM public.noticias WHERE json_array_length(imagens_urls) > 0) THEN
      RAISE EXCEPTION 'Rollback bloqueado: há fotos extras. Preserve os dados e mantenha a coluna.';
    END IF;
    ALTER TABLE public.noticias DROP COLUMN imagens_urls;
  END IF;
END $$;
COMMIT;
-- RLS e restrições de acesso permanecem ativas.
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'noticias' ORDER BY ordinal_position;
