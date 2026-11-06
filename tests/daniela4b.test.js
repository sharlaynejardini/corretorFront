import test from "node:test";
import assert from "node:assert/strict";
import { QUESTOES_DANIELA_4B, obterQuestaoDaniela4b, resumirAnaliseDaniela4b, orientarQuestaoDaniela4b } from "../src/daniela4b.js";

const numeros = [...Array.from({ length: 31 }, (_, i) => 90 + i), ...Array.from({ length: 31 }, (_, i) => 136 + i)];
const respostas = numeros.map((numero, i) => ({
  numero_questao: i + 1, disciplina: `Questao ${numero}`,
  resposta_correta: [90, 155, 161].includes(numero) ? "X" : "A", acertou: true,
}));

test("mapeamento preserva as 62 questoes e as particularidades informadas", () => {
  assert.deepEqual(Object.keys(QUESTOES_DANIELA_4B).map(Number), numeros);
  assert.equal(obterQuestaoDaniela4b("Questao 91").habilidade, "H20");
  assert.equal(obterQuestaoDaniela4b("Questao 91").area, "Ciências da Natureza");
  assert.equal(obterQuestaoDaniela4b("Questao 149").habilidade, "H20");
  assert.equal(obterQuestaoDaniela4b("Questao 149").area, "Matemática");
  assert.match(obterQuestaoDaniela4b("Questao 165").conteudo, /não confirmado/);
  assert.equal(obterQuestaoDaniela4b("Questao 166").habilidade, null);
  assert.match(obterQuestaoDaniela4b("Questao 166").conteudo, /densidade demográfica/);
  assert.equal(obterQuestaoDaniela4b("Q01 - H16 - Lingua Portuguesa"), null);
});

test("anuladas nao elevam aproveitamento nem aparecem como habilidades atingidas", () => {
  const resultado = resumirAnaliseDaniela4b(respostas);
  assert.equal(resultado.total, 59);
  assert.equal(resultado.acertos, 59);
  assert.equal(resultado.nota, 10);
  assert.deepEqual(resultado.areas, {
    "Ciências da Natureza": { acertos: 30, total: 30 },
    "Matemática": { acertos: 29, total: 29 },
  });
  for (const numero of [90, 155, 161]) assert.equal(resultado.disciplinas[`Questao ${numero}`], undefined);
});

test("erros e brancos contam entre as validas, com separacao por area", () => {
  const comErros = respostas.map((r) => ({ ...r, acertou: ["Questao 91", "Questao 166"].includes(r.disciplina) ? false : r.acertou }));
  const resultado = resumirAnaliseDaniela4b(comErros);
  assert.equal(resultado.acertos, 57);
  assert.equal(resultado.total, 59);
  assert.equal(resultado.nota, 57 / 59 * 10);
  assert.deepEqual(resultado.areas["Ciências da Natureza"], { acertos: 29, total: 30 });
  assert.deepEqual(resultado.areas["Matemática"], { acertos: 28, total: 29 });
  assert.equal(resumirAnaliseDaniela4b().nota, null);
});

test("orientacao respeita o conteudo e explicita a falta de confirmacao", () => {
  assert.match(orientarQuestaoDaniela4b(QUESTOES_DANIELA_4B[91], 20), /energia cinética/);
  assert.match(orientarQuestaoDaniela4b(QUESTOES_DANIELA_4B[165], 20), /Confirmar/);
});
