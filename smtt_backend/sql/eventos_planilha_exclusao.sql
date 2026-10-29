-- Executar no SQL Editor do Supabase após eventos_planilha.sql.
BEGIN;
ALTER TABLE public.eventos_planilha ALTER COLUMN evento_id DROP NOT NULL;
ALTER TABLE public.eventos_planilha
    DROP CONSTRAINT IF EXISTS eventos_planilha_evento_id_fkey;
ALTER TABLE public.eventos_planilha
    ADD CONSTRAINT eventos_planilha_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.solicitacoes_eventos(id) ON DELETE SET NULL;
COMMIT;
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.eventos_planilha'::regclass AND contype = 'f';
SELECT count(*) AS exclusoes_pendentes_de_reflexo
FROM public.eventos_planilha WHERE evento_id IS NULL;
-- Rollback operacional sem perda: publicar a versão anterior do Apps Script
-- (não processar excluidos). Não remover os tombstones nem recriar seus eventos.
-- Restaurar NOT NULL só é viável se não houver evento_id nulo.
