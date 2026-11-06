import { numeroQuestaoNaProva } from "./questoes.js";

// Identificacoes pedagogicas fornecidas para esta avaliacao, nao descricoes
// oficiais integrais da matriz do ENEM. Habilidades pertencem a cada area.
const natureza = [
  [91, "H20", "Física", "Energia cinética, colisões e deformação dos veículos"],
  [92, "H17", "Química", "Células a combustível microbianas e reações de oxirredução"],
  [93, "H24", "Química", "Características e definição de compostos orgânicos"],
  [94, "H24", "Química", "Funções orgânicas, ácidos e bases de Brønsted-Lowry"],
  [95, "H11", "Biologia", "Biotecnologia, RT-PCR e expressão gênica"],
  [96, "H20", "Física", "Centro de massa e equilíbrio de rodas"],
  [97, "H17", "Química", "Concentração de soluções e cálculos estequiométricos"],
  [98, "H16", "Biologia", "Evolução dos mamíferos e adaptações reprodutivas"],
  [99, "H1", "Física", "Efeito Doppler e ondas sonoras"],
  [100, "H1", "Física", "Óptica geométrica, espelhos côncavos e formação de imagens"],
  [101, "H1", "Física", "Acústica, intensidade sonora e decibéis"],
  [102, "H14", "Biologia", "Enzimas, desnaturação e conservação de alimentos"],
  [103, "H21", "Física", "Transferência de calor por convecção"],
  [104, "H30", "Biologia", "Urbanização, saneamento e saúde pública"],
  [105, "H10", "Biologia", "Bioacumulação de poluentes e tecido adiposo"],
  [106, "H6", "Física", "Raios X, absorção da radiação e materiais"],
  [107, "H14", "Biologia/Química", "Digestão, ácido clorídrico e formação de nitrosaminas"],
  [108, "H4", "Biologia", "Sucessão ecológica e sistemas agroflorestais"],
  [109, "H14", "Biologia", "Fibras musculares e metabolismo energético"],
  [110, "H28", "Biologia", "Mimetismo e seleção natural"],
  [111, "H15", "Biologia", "Exoesqueleto, crescimento e muda dos artrópodes"],
  [112, "H13", "Biologia", "Genética, heredogramas e padrões de herança"],
  [113, "H9", "Biologia", "Manejo de pragas e controle biológico"],
  [114, "H26", "Biologia", "Fotossíntese, respiração e trocas gasosas"],
  [115, "H15", "Biologia", "Reprodução celular e divisão de protozoários"],
  [116, "H17", "Química", "Separação de misturas por decantação"],
  [117, "H28", "Química", "Equilíbrio químico e pH"],
  [118, "H21", "Química", "Desmineralização dentária e equilíbrio químico"],
  [119, "H20", "Física", "Movimento, deslocamento e interpretação de trajetórias"],
  [120, "H30", "Biologia", "Microscopia e identificação de estruturas celulares"],
];
const matematica = [
  [136, "H2", "Sequências numéricas e padrões"],
  [137, "H29", "Análise combinatória e contagem de possibilidades"],
  [138, "H14", "Análise combinatória e formação de números"],
  [139, "H1", "Razões, proporções e comparação de grandezas"],
  [140, "H3", "Porcentagem e classificação de desempenho"],
  [141, "H18", "Interpretação de gráficos cartesianos"],
  [142, "H6", "Padrões e sequências em representações numéricas"],
  [143, "H18", "Porcentagem, custos e lucro"],
  [144, "H10", "Geometria plana e cálculo de áreas"],
  [145, "H4", "Proporcionalidade e escala"],
  [146, "H3", "Interpretação de dados e porcentagem"],
  [147, "H16", "Frações equivalentes e comparação de números racionais"],
  [148, "H15", "Funções e interpretação de gráficos"],
  [149, "H20", "Geometria espacial e volume de cilindros"],
  [150, "H15", "Geometria plana e cálculo de áreas"],
  [151, "H7", "Escalas e conversão de unidades de área"],
  [152, "H21", "Interpretação de gráficos estatísticos"],
  [153, "H8", "Porcentagem e representação decimal"],
  [154, "H12", "Medidas de tendência central e interpretação de tabelas"],
  [155, "H8", "Geometria plana – Área de setores circulares"],
  [156, "H7", "Expressões algébricas e cálculo de tarifas"],
  [157, "H8", "Porcentagem, descontos e acréscimos"],
  [158, "H23", "Porcentagem e cálculo de preços"],
  [159, "H4", "Grandezas e unidades de medida"],
  [160, "H27", "Proporcionalidade, vazão e volume"],
  [161, "H20", "Interpretação de gráficos e funções"],
  [162, "H13", "Geometria espacial e identificação de sólidos"],
  [163, "H22", "Geometria plana, circunferências e comprimento de correias"],
  [164, "H16", "Geometria plana, triângulos e distâncias"],
  [165, "H12", "Conteúdo específico pendente de confirmação"],
  [166, "H4", "Razão, proporção e densidade demográfica"],
];

export const QUESTOES_DANIELA_4B = Object.fromEntries([
  { numero: 90, habilidade: null, area: null, disciplina: null, conteudo: "Questão anulada", anulada: true },
  ...natureza.map(([numero, habilidade, disciplina, conteudo]) => ({
    numero, habilidade, disciplina, conteudo, area: "Ciências da Natureza", anulada: false,
  })),
  ...matematica.map(([numero, habilidade, conteudo]) => ({
    numero, habilidade, conteudo, disciplina: "Matemática", area: "Matemática",
    anulada: [155, 161].includes(numero),
  })),
].map((questao) => [questao.numero, questao]));

export function obterQuestaoDaniela4b(disciplina) {
  const numero = String(disciplina || "").match(/^Quest[aã]o\s+(\d+)$/i)?.[1];
  return QUESTOES_DANIELA_4B[numero] || null;
}

export function resumirAnaliseDaniela4b(respostas = []) {
  const disciplinas = {};
  const areas = {};
  let acertos = 0;
  let total = 0;
  for (const resposta of respostas) {
    const questao = QUESTOES_DANIELA_4B[numeroQuestaoNaProva(resposta)];
    if (!questao || questao.anulada || resposta.resposta_correta === "X") continue;
    const acertou = resposta.acertou === true;
    const chave = resposta.disciplina || `Questao ${questao.numero}`;
    disciplinas[chave] = { total: 1, acertos: Number(acertou), nota: acertou ? 10 : 0 };
    areas[questao.area] ||= { acertos: 0, total: 0 };
    areas[questao.area].total += 1;
    areas[questao.area].acertos += Number(acertou);
    total += 1;
    acertos += Number(acertou);
  }
  return { disciplinas, areas, acertos, total, nota: total ? acertos / total * 10 : null };
}

export function orientarQuestaoDaniela4b(questao, aproveitamento) {
  if (!questao || questao.anulada) return "Questão excluída do aproveitamento.";
  if (questao.numero === 165) return "Confirmar o conteúdo da questão antes de planejar a intervenção pedagógica.";
  const acao = aproveitamento < 50 ? "Retomar" : aproveitamento < 70 ? "Reforçar" : "Consolidar";
  return `${acao} ${questao.conteudo.charAt(0).toLowerCase()}${questao.conteudo.slice(1)} com atividades e nova verificação de aprendizagem.`;
}
