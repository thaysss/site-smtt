-- Executar no SQL Editor do Supabase antes de publicar o backend.
-- Horários civis de Brasília (America/Sao_Paulo), sem conversão para UTC.
BEGIN;
ALTER TABLE public.alertas_transito
    ADD COLUMN IF NOT EXISTS interdicao_inicio timestamp without time zone,
    ADD COLUMN IF NOT EXISTS interdicao_fim timestamp without time zone;
ALTER TABLE public.alertas_transito
    ADD CONSTRAINT alertas_periodo_interdicao_valido CHECK (
        (interdicao_inicio IS NULL AND interdicao_fim IS NULL)
        OR (interdicao_inicio IS NOT NULL AND interdicao_fim IS NOT NULL
            AND interdicao_fim > interdicao_inicio)
    );
COMMENT ON COLUMN public.alertas_transito.interdicao_inicio IS 'Início previsto, horário civil de Brasília (UTC-3).';
COMMENT ON COLUMN public.alertas_transito.interdicao_fim IS 'Fim previsto, horário civil de Brasília (UTC-3).';
-- Preserva RLS, grants, índices e chaves existentes. Registros antigos ficam sem período.
COMMIT;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'alertas_transito'
AND column_name IN ('interdicao_inicio', 'interdicao_fim');

-- Rollback seguro após reverter o código: mantém os horários cadastrados.
-- BEGIN;
-- ALTER TABLE public.alertas_transito DROP CONSTRAINT IF EXISTS alertas_periodo_interdicao_valido;
-- COMMIT;
-- As colunas são mantidas para evitar perda de dados.
