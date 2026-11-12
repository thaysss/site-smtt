import renainf from '../data/infracoesRenainf.json' with { type: 'json' };
import { INFRACOES_COMUNS_CTB } from '../data/infracoesComuns.js';

const normalizar = (valor) => String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const normalizarCodigo = (valor) => String(valor).trim().replace(/[.\s-]/g, '');

const importadas = renainf.map((item) => {
  const natureza = normalizar(item.gravidade_original);
  const gravidade = natureza.includes('graviss') ? 'Gravíssima'
    : natureza.includes('grave') ? 'Grave'
      : natureza.includes('media') ? 'Média' : natureza.includes('leve') ? 'Leve' : '';
  const codigo = item.codigo_base + item.desdobramento;
  const comum = INFRACOES_COMUNS_CTB.find((tipo) => tipo.codigo === codigo);
  return {
    ...item,
    codigo,
    amparo_legal: `Art. ${item.amparo_legal}`,
    gravidade,
    pontos: gravidade ? ({ 'Leve': '3', 'Média': '4', 'Grave': '5', 'Gravíssima': '7' })[gravidade] : '',
    // A planilha não informa valores. Preserva apenas os já conhecidos para o mesmo enquadramento.
    valor: comum?.gravidade === gravidade && comum?.amparo_legal === `Art. ${item.amparo_legal}` ? comum.valor : '',
    origem: 'renainf',
  };
});

export const CATALOGO_INFRACOES = [
  ...importadas,
  ...INFRACOES_COMUNS_CTB.filter((item) => item.codigo.length === 5 && !importadas.some((tipo) => tipo.codigo === item.codigo))
    .map((item) => ({ ...item, codigo_base: item.codigo.slice(0, 4), desdobramento: item.codigo.slice(4) })),
].sort((a, b) => a.codigo.localeCompare(b.codigo));

export function encontrarInfracao(valor) {
  const codigo = normalizarCodigo(valor);
  // Quatro dígitos identificam a família; o desdobramento exige seleção explícita.
  return codigo.length === 5 ? CATALOGO_INFRACOES.find((item) => item.codigo === codigo) : undefined;
}

export function buscarInfracoes(valor) {
  const termos = normalizar(valor).split(/\s+/).filter(Boolean);
  const codigo = normalizarCodigo(valor);
  if (!termos.length) return [];
  return CATALOGO_INFRACOES.filter((item) =>
    (/^\d+$/.test(codigo) && item.codigo.includes(codigo)) ||
    termos.every((termo) => normalizar(`${item.descricao} ${item.amparo_legal} ${item.codigo_base}-${item.desdobramento}`).includes(termo))
  );
}
