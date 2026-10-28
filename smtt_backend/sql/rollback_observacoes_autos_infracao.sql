-- Somente após voltar o backend à versão anterior.
-- Interrompe sem excluir a coluna se houver observações preenchidas.
BEGIN;
LOCK TABLE public.autos_infracao IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.autos_infracao WHERE observacoes IS NOT NULL AND observacoes <> '') THEN
    RAISE EXCEPTION 'Rollback cancelado: há observações salvas. Exporte e preserve os dados antes de remover a coluna.';
  END IF;
END $$;
ALTER TABLE public.autos_infracao DROP COLUMN observacoes;
COMMIT;
