export function formatarDescricaoInfracao(descricao, desdobramento) {
  const texto = String(descricao ?? '').trim();
  const codigo = String(desdobramento ?? '').trim();
  if (!texto || !codigo) return texto;
  const prefixo = `${codigo} - `;
  return texto.startsWith(prefixo) ? texto : prefixo + texto;
}
