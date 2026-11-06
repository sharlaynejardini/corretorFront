export function numeroQuestaoNaProva(questao) {
  const numeroImpresso = String(questao.disciplina || "").match(/^Quest[aã]o\s+(\d+)$/i);
  return numeroImpresso ? Number(numeroImpresso[1]) : (questao.numero_questao ?? questao.numero);
}
