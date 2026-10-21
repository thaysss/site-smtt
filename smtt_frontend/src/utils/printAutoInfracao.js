// Build the document with textContent so registered data cannot inject HTML.
export function printAutoInfracao(infracao) {
  const popup = window.open('', '_blank');
  if (!popup) {
    window.alert('Permita a abertura de janelas para imprimir o auto de infração.');
    return;
  }
  popup.opener = null;
  const doc = popup.document;
  doc.documentElement.lang = 'pt-BR';
  doc.title = `Auto de Infração - ${infracao.numero_ait || 'Sem número'}`;
  const style = doc.createElement('style');
  style.textContent = `
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 24px auto; max-width: 780px; color: #111; font: 12px Arial, sans-serif; }
    header { border-bottom: 2px solid #111; padding-bottom: 16px; }
    h1 { font-size: 21px; margin: 12px 0; } h2 { font-size: 13px; margin: 0; padding: 8px; background: #eee; }
    section { border: 1px solid #aaa; margin-top: 16px; break-inside: avoid; }
    dl { display: grid; grid-template-columns: 1fr 1fr; margin: 0; }
    dl div { padding: 9px; min-width: 0; } dt { font-size: 10px; color: #444; margin-bottom: 4px; }
    dd { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .wide { grid-column: 1 / -1; } footer { margin-top: 20px; font-size: 10px; color: #444; }
    nav { display: flex; gap: 12px; margin-bottom: 24px; } button { padding: 10px 18px; cursor: pointer; }
    @media print { body { margin: 0; max-width: none; } nav { display: none; } }
  `;
  doc.head.append(style);
  const element = (tag, text, parent) => {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    parent.append(node);
    return node;
  };
  const nav = element('nav', undefined, doc.body);
  element('button', 'Imprimir / Salvar PDF', nav).onclick = () => { popup.focus(); popup.print(); };
  element('button', 'Fechar', nav).onclick = () => popup.close();
  const header = element('header', undefined, doc.body);
  element('strong', 'SMTT — Município de Propriá / SE', header);
  element('h1', 'Auto de Infração de Trânsito', header);
  element('div', `Número do AIT: ${infracao.numero_ait || 'Não informado'}`, header);
  const section = (title, fields) => {
    const container = element('section', undefined, doc.body);
    element('h2', title, container);
    const list = element('dl', undefined, container);
    fields.forEach(([label, value, wide]) => {
      const row = element('div', undefined, list);
      if (wide) row.className = 'wide';
      element('dt', label, row);
      element('dd', value === null || value === undefined || value === '' ? 'Não informado' : value, row);
    });
  };
  const vehicle = infracao.veiculo || {};
  const type = infracao.tipo_infracao || {};
  section('Identificação do veículo', [
    ['Placa', vehicle.placa], ['UF', vehicle.uf], ['Marca / Modelo', vehicle.marca_modelo],
    ['Cor', vehicle.cor], ['Ano de fabricação', vehicle.ano_fabricacao], ['Renavam', vehicle.renavam],
  ]);
  section('Ocorrência', [
    ['Data e hora', infracao.data_hora_infracao], ['Local do cometimento', infracao.local_cometimento],
  ]);
  section('Enquadramento', [
    ['Código da infração', type.codigo_infracao], ['Desdobramento', infracao.desdobramento],
    ['Descrição', type.descricao, true], ['Amparo legal', type.amparo_legal], ['Gravidade', type.gravidade],
    ['Pontuação', type.pontos],
    ['Valor da multa', infracao.valor_final == null ? null : Number(infracao.valor_final).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
  ]);
  section('Dados operacionais', [
    ['Agente / Aparelho', infracao.agente_aparelho], ['Código Renainf', infracao.codigo_renainf],
    ['Medição regulamentada', infracao.medicao_regulamentada], ['Medição aferida', infracao.medicao_aferida],
    ['Medição considerada', infracao.medicao_considerada],
  ]);
  section('Controle do registro', [
    ['Fase atual', infracao.fase_atual], ['Data de expedição', infracao.data_expedicao],
    ['Prazo da defesa', infracao.data_vencimento_defesa], ['Número da NAIT', infracao.numero_nait],
    ['Número da NIP', infracao.numero_nip],
  ]);
  element('footer', `Cópia dos dados cadastrados no sistema SMTT. Emitida em ${new Date().toLocaleString('pt-BR')}.`, doc.body);
  popup.focus();
  popup.print();
}
