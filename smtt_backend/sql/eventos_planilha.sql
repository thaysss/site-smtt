-- Executar no SQL Editor do Supabase. Backend usa conexão PostgreSQL privilegiada.
BEGIN;
CREATE TABLE IF NOT EXISTS public.eventos_planilha (
    chave varchar(36) PRIMARY KEY,
    evento_id integer NOT NULL UNIQUE REFERENCES public.solicitacoes_eventos(id),
    base json NOT NULL
);
ALTER TABLE public.eventos_planilha ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.eventos_planilha FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.eventos_planilha TO service_role;
COMMIT;
SELECT count(*) AS vinculos FROM public.eventos_planilha;
-- Rollback seguro: desativar EVENTOS_SYNC_TOKEN e remover o gatilho do Apps Script.
-- Preservar esta tabela: apagá-la perde vínculos e pode duplicar eventos na reativação.
