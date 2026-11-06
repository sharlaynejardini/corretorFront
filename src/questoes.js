export function numeroQuestaoNaProva(questao) {
  const numeroImpresso = String(questao.disciplina || "").match(/^Quest[aã]o\s+(\d+)$/i);
  return numeroImpresso ? Number(numeroImpresso[1]) : (questao.numero_questao ?? questao.numero);
}

export function ordenarRespostasPorDisciplinas(respostas = [], disciplinas = []) {
  const ordem = new Map(disciplinas.map((disciplina, indice) => [disciplina, indice]));
  return [...respostas].sort((a, b) =>
    (ordem.get(a.disciplina) ?? disciplinas.length) - (ordem.get(b.disciplina) ?? disciplinas.length)
    || a.numero_questao - b.numero_questao
  );
}
