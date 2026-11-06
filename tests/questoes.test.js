import test from "node:test";
import assert from "node:assert/strict";
import { numeroQuestaoNaProva, ordenarRespostasPorDisciplinas } from "../src/questoes.js";

test("resultado da substitutiva segue a ordem regular sem alterar as respostas da prova", () => {
  const disciplinas = ["Portugues", "Historia", "Geografia", "Ed. Fisica"];
  const respostas = Array.from({ length: 30 }, (_, i) => ({
    numero_questao: i + 1,
    disciplina: i < 6 ? "Ed. Fisica" : i < 12 ? "Historia" : i < 24 ? "Portugues" : "Geografia",
    resposta_aluno: i === 13 ? null : "A",
    resposta_correta: i === 13 ? "X" : "B",
    acertou: i === 13,
  }));
  const copia = structuredClone(respostas);
  const resultado = ordenarRespostasPorDisciplinas(respostas, disciplinas);
  assert.deepEqual([...new Set(resultado.map((r) => r.disciplina))], disciplinas);
  assert.deepEqual(resultado.map((r) => r.numero_questao), [
    ...Array.from({ length: 12 }, (_, i) => i + 13),
    ...Array.from({ length: 6 }, (_, i) => i + 7),
    ...Array.from({ length: 6 }, (_, i) => i + 25),
    ...Array.from({ length: 6 }, (_, i) => i + 1),
  ]);
  assert.deepEqual(respostas, copia);
  assert.equal(resultado[1], respostas[13]);
  assert.equal(resultado[1].resposta_correta, "X");
  assert.equal(resultado[1].resposta_aluno, null);
  assert.equal(numeroQuestaoNaProva(resultado[1]), 14);
});
