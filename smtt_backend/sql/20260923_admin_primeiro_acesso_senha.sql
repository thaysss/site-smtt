-- Execute este arquivo no SQL Editor do Supabase antes de publicar a nova versão.
-- As contas existentes serão solicitadas a trocar a senha no próximo login,
-- pois o esquema anterior não registrava se o primeiro acesso já ocorreu.

BEGIN;

ALTER TABLE public.servidores
    ADD COLUMN IF NOT EXISTS senha_temporaria boolean;

UPDATE public.servidores
SET senha_temporaria = true
WHERE senha_temporaria IS NULL;

ALTER TABLE public.servidores
    ALTER COLUMN senha_temporaria SET DEFAULT true,
    ALTER COLUMN senha_temporaria SET NOT NULL;

COMMENT ON COLUMN public.servidores.senha_temporaria IS
    'Indica que o servidor deve definir uma nova senha antes de acessar o painel administrativo.';

ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verificação pós-migração: deve retornar zero em valores_nulos.
SELECT
    COUNT(*) FILTER (WHERE senha_temporaria) AS trocas_pendentes,
    COUNT(*) FILTER (WHERE senha_temporaria IS NULL) AS valores_nulos,
    COUNT(*) AS total_servidores
FROM public.servidores;

-- Rollback seguro do esquema (use somente antes de usuários concluírem a troca):
-- BEGIN;
-- ALTER TABLE public.servidores DROP COLUMN IF EXISTS senha_temporaria;
-- COMMIT;
