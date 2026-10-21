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
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 24px auto; padding: 15px; max-width: 800px; border: 1px solid #ccc; background: white; color: #111; font: 11px Arial, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand img { width: 50px; height: 50px; object-fit: contain; }
    .brand strong { display: block; color: #003399; font-size: 11px; text-transform: uppercase; }
    .brand small { display: block; margin-top: 3px; color: #555; font-size: 9px; font-weight: bold; }
    .document-title { text-align: right; } h1 { font-size: 10px; text-transform: uppercase; margin: 0 0 5px; }
    h2 { font-size: 9px; margin: 0; padding: 4px 8px; background: #333; color: white; text-transform: uppercase; letter-spacing: .5px; }
    section { border: 1px solid #333; border-radius: 4px; overflow: hidden; margin-top: 12px; break-inside: avoid; }
    dl { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0; }
    dl div { padding: 6px; min-width: 0; border-bottom: 1px solid #eee; }
    dl div:nth-child(even) { background: #fafafa; }
    dt { font-size: 8px; color: #666; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
    dd { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .wide { grid-column: 1 / -1; } footer { margin-top: 15px; padding-top: 6px; border-top: 1px solid #ccc; font-size: 8px; color: #777; text-align: center; font-style: italic; }
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
  const brand = element('div', undefined, header);
  brand.className = 'brand';
  const logo = element('img', undefined, brand);
  logo.alt = 'Logo SMTT';
  const logoReady = new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve;
  });
  logo.src = new URL('/SMTT.png', window.location.origin).href;
  const brandText = element('div', undefined, brand);
  element('strong', 'Superintendência Municipal de Trânsito e Transporte', brandText);
  element('small', 'SMTT PROPRIÁ — PROPRIÁ/SE', brandText);
  const heading = element('div', undefined, header);
  heading.className = 'document-title';
  element('h1', 'Auto de Infração de Trânsito', heading);
  element('div', `Número do AIT: ${infracao.numero_ait || 'Não informado'}`, heading);
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
  section('Dados da infração — Identificação do veículo', [
    ['Órgão autuador', 'SMTT PROPRIÁ'], ['Número do auto (AIT)', infracao.numero_ait],
    ['Placa', vehicle.placa || infracao.placa_veiculo], ['UF', vehicle.uf], ['Marca / Modelo', vehicle.marca_modelo],
    ['Cor', vehicle.cor], ['Ano de fabricação', vehicle.ano_fabricacao], ['Renavam', vehicle.renavam],
  ]);
  section('Ocorrência', [
    ['Data e hora', infracao.data_hora_infracao], ['Local do cometimento', infracao.local_cometimento, true],
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
  // Wait for the logo before opening the print preview, including on a cold cache.
  logoReady.then(() => {
    if (!popup.closed) {
      popup.focus();
      popup.print();
    }
  });
}
