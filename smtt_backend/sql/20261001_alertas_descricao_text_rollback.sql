-- Opcional: só reverte se nenhum texto ultrapassar 255 caracteres.
-- Nunca trunca descrições: se houver textos longos, interrompe a transação.
BEGIN;
LOCK TABLE public.alertas_transito IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.alertas_transito WHERE char_length(descricao) > 255) THEN
        RAISE EXCEPTION 'Rollback bloqueado: existem descrições com mais de 255 caracteres. Nenhum dado foi truncado.';
    END IF;
END $$;
ALTER TABLE public.alertas_transito ALTER COLUMN descricao TYPE varchar(255);
COMMIT;

SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'alertas_transito'
  AND column_name = 'descricao';
