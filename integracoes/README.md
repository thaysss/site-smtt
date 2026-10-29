# Eventos: site ↔ Google Planilhas

Implementação preparada para a planilha `1dQBYEBO5EtWobprCbXY6GZiQxZ6HASOCpYHj28QyM-8`.
O conector do chat não é a credencial de execução do site.

## Ativação

1. Executar **todo** `smtt_backend/sql/eventos_planilha.sql` no SQL Editor do Supabase antes de ativar.
2. Publicar o backend e configurar `EVENTOS_SYNC_TOKEN` no ambiente do servidor com um segredo aleatório de pelo menos 32 caracteres. Não colocar em Vite, Git ou células.
3. Na planilha, abrir Extensões → Apps Script e colar `integracoes/eventos.gs`.
4. Em Configurações do projeto → Propriedades do script, criar `SMTT_SYNC_TOKEN` com o mesmo segredo e `SMTT_SYNC_URL` com a URL HTTPS do backend terminada em `/api/integracoes/eventos/sincronizar`.
5. Executar `prepararIntegracao` e autorizar o Google. Ela cria a aba **Eventos SMTT** e um gatilho a cada cinco minutos. Executar `sincronizarEventos` uma vez e verificar Execuções. As autorizações e instalação do gatilho precisam ser feitas pelo responsável da conta.
6. Cadastrar um evento de teste na nova aba (data `2026-11-10T14:30`), sincronizar e verificar no calendário administrativo. Cadastrar pelo site, sincronizar e conferir a nova linha na aba. Alterar um campo em cada lado e confirmar atualização.

## Uso e limites

- Cadastrar e editar na aba **Eventos SMTT**, ou cadastrar pelo site. ID SMTT é técnico: não editar, limpar ou copiar para outro evento.
- Abas 2025/2026 preservadas como histórico. **Os eventos antigos não são importados automaticamente.** Conferir e transcrever os que devem entrar na integração, usando data completa; a coluna RECEBIDO das abas históricas não é a data do evento. Conferir se já existem no site antes de transcrever para evitar duplicação entre cadastros anteriores.
- Sincroniza responsável, contato, data/início, local e descrição. Não sincroniza CPF, e-mail, documentos, decisão administrativa, despacho, término ou serviço. Eventos da planilha entram em análise e sem documento; sua revisão/complementação é responsabilidade administrativa.
- Não exclui registros por remover uma linha. O evento pode reaparecer na próxima execução. Cancelamentos/decisões continuam no site.
- No primeiro envio todos os eventos do site são apresentados na nova aba. O endpoint é exclusivo desta integração; não reutilizar o token em outra planilha.
- Conflitos no mesmo campo aparecem como erro no histórico de Execuções; nenhuma alteração desse evento é aplicada. Compare as versões e deixe o campo com o mesmo valor nos dois lados para resolver. Alterações em campos diferentes são combinadas.
- Limite de 1000 linhas enviadas por execução; não dividir em lotes sem implementar paginação. Datas antigas do site fora do formato ISO precisam ser corrigidas antes da próxima sincronização.
- O segredo dá acesso de leitura/escrita a esses campos de todos os eventos. Restrinja os editores do Apps Script. Nenhuma autorização do chat substitui o acesso persistente desta integração.
- Desativar: apagar o gatilho e remover o token do ambiente. Preservar a tabela de vínculos para não duplicar eventos ao reativar.

## Verificação local

`python -m pytest tests/test_eventos_sync.py tests/test_admin_eventos.py -q`, dentro de `smtt_backend`.
O teste local não confirma autorização Google, migração em produção ou execução do gatilho.
