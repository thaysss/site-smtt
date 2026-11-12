import assert from 'node:assert/strict';
import test from 'node:test';
import { buscarInfracoes, encontrarInfracao, CATALOGO_INFRACOES } from '../src/utils/catalogoInfracoes.js';

test('preserva os 258 enquadramentos da planilha, sem códigos duplicados', () => {
  assert.equal(CATALOGO_INFRACOES.filter((item) => item.origem === 'renainf').length, 258);
  assert.equal(new Set(CATALOGO_INFRACOES.map((item) => item.codigo)).size, CATALOGO_INFRACOES.length);
  for (const item of CATALOGO_INFRACOES) {
    assert.equal(item.codigo, item.codigo_base + item.desdobramento);
  }
});

test('quatro dígitos mostram os desdobramentos para escolha explícita', () => {
  assert.equal(encontrarInfracao('5029'), undefined);
  assert.deepEqual(buscarInfracoes('5029').map((item) => item.codigo), ['50291', '50292']);
  assert.match(encontrarInfracao('5029-2').descricao, /suspensão/);
  assert.match(encontrarInfracao('5029-1').descricao, /cassada/);
});

test('busca ignora acentos, caixa e aceita código formatado ou palavras', () => {
  assert.equal(encontrarInfracao(' 745-50 ').codigo, '74550');
  assert.ok(buscarInfracoes('CINTO SEGURANCA').some((item) => item.codigo === '51851'));
  assert.equal(buscarInfracoes('7455-0')[0].codigo, '74550');
  assert.deepEqual(buscarInfracoes('   '), []);
  assert.deepEqual(buscarInfracoes('texto inexistente qwerty'), []);
});

test('preenche enquadramento e mantém informações adicionais da fonte', () => {
  const item = encontrarInfracao('55411');
  assert.equal(item.desdobramento, '1');
  assert.equal(item.amparo_legal, 'Art. 181, XVII');
  assert.equal(item.gravidade, 'Grave');
  assert.equal(item.pontos, '5');
  assert.equal(item.infrator, 'Condutor');
  assert.equal(item.competencia, 'MUNICIPAL/RODOV');
  assert.equal(item.valor, '');
  assert.equal(encontrarInfracao('50020').gravidade, '');
  assert.equal(encontrarInfracao('50020').pontos, '');
});

test('preserva códigos anteriores ausentes da planilha e regras de velocidade', () => {
  assert.equal(encontrarInfracao('73662').amparo_legal, 'Art. 252, PÚ');
  for (const [codigo, pontos, valor] of [['74550', '4', '130.16'], ['74630', '5', '195.23'], ['74710', '7', '880.41']]) {
    const item = encontrarInfracao(codigo);
    assert.equal(item.pontos, pontos);
    assert.equal(item.valor, valor);
    assert.equal(item.desdobramento, '0');
  }
});
