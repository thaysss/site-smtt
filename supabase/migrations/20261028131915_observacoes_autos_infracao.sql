-- Execute no SQL Editor do Supabase ANTES de publicar o backend.
BEGIN;
ALTER TABLE public.autos_infracao ADD COLUMN IF NOT EXISTS observacoes text;
-- Falha explicitamente se uma coluna existente tiver tipo divergente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'autos_infracao'
      AND column_name = 'observacoes' AND data_type = 'text' AND is_nullable = 'YES'
  ) THEN
    RAISE EXCEPTION 'autos_infracao.observacoes deve ser text e aceitar NULL';
  END IF;
END $$;
-- Campo opcional: preserva registros existentes, RLS, policies e grants da tabela.
-- Sem novos índices ou FKs: o campo armazena texto livre e não é usado para busca.
COMMIT;

-- Verificação pós-migração (deve retornar observacoes / text / YES).
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'autos_infracao'
  AND column_name = 'observacoes';
