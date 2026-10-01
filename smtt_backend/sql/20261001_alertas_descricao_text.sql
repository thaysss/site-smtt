-- Execute no SQL Editor do Supabase. Não altera os textos existentes.
BEGIN;
ALTER TABLE public.alertas_transito
    ALTER COLUMN descricao TYPE text;
-- NOT NULL, RLS, grants, índices e chaves existentes são preservados.
COMMIT;

-- Verificação: data_type deve retornar text.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'alertas_transito'
  AND column_name = 'descricao';
