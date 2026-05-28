import { useEffect, useMemo, useRef, useState } from "react";
import api from "./api";
import "./App.css";

const ALTERNATIVAS = ["A", "B", "C", "D", "X"];
const SERIES = [5, 6, 7, 8, 9];
const CORES_DISCIPLINAS = {
  LP: "#4285f4",
  "Lingua Portuguesa": "#4285f4",
  "Língua Portuguesa": "#4285f4",
  Portugues: "#4285f4",
  Português: "#4285f4",
  His: "#fbbc04",
  Historia: "#fbbc04",
  História: "#fbbc04",
  Geo: "#34a853",
  Geografia: "#34a853",
  EF: "#ff7043",
  "Educacao Fisica": "#ff7043",
  "Educação Física": "#ff7043",
  Mat: "#a142f4",
  Matematica: "#a142f4",
  Matemática: "#a142f4",
  Cie: "#00acc1",
  Ciencias: "#00acc1",
  Ciências: "#00acc1",
  Artes: "#ec407a",
  Ingles: "#7cb342",
  Inglês: "#7cb342",
};
const PALETA_DISCIPLINAS = [
  "#4285f4",
  "#fbbc04",
  "#34a853",
  "#ff7043",
  "#a142f4",
  "#00acc1",
  "#ec407a",
  "#7cb342",
  "#5c6bc0",
  "#8d6e63",
];
const GRUPOS_GABARITO = [
  { codigo: "PADRAO", nome: "Padrao" },
  { codigo: "SUBSTITUTIVA", nome: "Substitutiva" },
  { codigo: "8AC", nome: "8A e 8C - Takaoka Dia 1" },
  { codigo: "8AC_SUBSTITUTIVA", nome: "8A e 8C - Substitutiva" },
  { codigo: "8B", nome: "8B - Takaoka Dia 1" },
];
const GABARITO_AUTOMATICO = "AUTO";
const ORDEM_DISCIPLINAS_RESULTADO = [
  "portugues",
  "historia",
  "geografia",
  "educacao fisica",
  "matematica",
  "ciencias",
  "artes",
  "ingles",
];
const EMAIL_LOGIN = "sharlayne.fonseca@professor.barueri.br";
const SENHA_LOGIN = "cadastro2026";

function App() {
  const fotoInputRef = useRef(null);
  const [logado, setLogado] = useState(
    () => localStorage.getItem("corretor-gabarito-logado") === "true"
  );
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [paginaAtual, setPaginaAtual] = useState("corrigir");

  const [escolas, setEscolas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [disciplinasModelo, setDisciplinasModelo] = useState([]);

  const [escolaId, setEscolaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");

  const [bimestre, setBimestre] = useState(2);
  const [dia, setDia] = useState(2);
  const [serieGabarito, setSerieGabarito] = useState(8);
  const [codigoGabarito, setCodigoGabarito] = useState("PADRAO");
  const [codigoGabaritoCorrecao, setCodigoGabaritoCorrecao] = useState(GABARITO_AUTOMATICO);

  const [foto, setFoto] = useState(null);
  const [respostasManuais, setRespostasManuais] = useState("");
  const [resultado, setResultado] = useState(null);
  const [resultadosPorAluno, setResultadosPorAluno] = useState({});
  const [buscaResultado, setBuscaResultado] = useState("");
  const [filtroStatusResultado, setFiltroStatusResultado] = useState("todos");
  const [comparacaoTurmas, setComparacaoTurmas] = useState([]);
  const [carregandoComparacaoTurmas, setCarregandoComparacaoTurmas] = useState(false);
  const [detalheAluno, setDetalheAluno] = useState(null);
  const [carregandoDetalheAluno, setCarregandoDetalheAluno] = useState(false);
  const [correcaoAlunoAtual, setCorrecaoAlunoAtual] = useState(null);
  const [carregandoCorrecaoAlunoAtual, setCarregandoCorrecaoAlunoAtual] = useState(false);
  const [gabaritoOficial, setGabaritoOficial] = useState({});
  const [mensagemGabarito, setMensagemGabarito] = useState("");
  const [adaptadaInline, setAdaptadaInline] = useState(null);

  useEffect(() => {
    carregarEscolas();
  }, []);

  useEffect(() => {
    carregarModeloEGabarito();
  }, [escolaId, bimestre, dia, serieGabarito, codigoGabarito]);

  useEffect(() => {
    if (escolaId && turmaId) {
      carregarResultadosSalvos(turmaId);
    }
  }, [escolaId, turmaId, bimestre, dia]);

  useEffect(() => {
    carregarCorrecaoAlunoSelecionado();
  }, [alunoId, escolaId, bimestre, dia, resultadosPorAluno]);

  useEffect(() => {
    if (paginaAtual === "analise" && escolaId && turmas.length > 0) {
      carregarComparacaoTurmas();
    }
  }, [paginaAtual, escolaId, bimestre, turmas]);

  const questoesModelo = useMemo(() => {
    let numeroQuestao = 1;

    return disciplinasModelo.flatMap((disciplina) => {
      return Array.from({ length: disciplina.quantidade_questoes }, () => {
        const questao = {
          numero: numeroQuestao,
          disciplina: disciplina.disciplina,
        };

        numeroQuestao += 1;
        return questao;
      });
    });
  }, [disciplinasModelo]);

  const disciplinasPlanilha = useMemo(() => {
    const disciplinas = new Set();

    Object.values(resultadosPorAluno).forEach((resultadoAluno) => {
      Object.keys(resultadoAluno.disciplinas || {}).forEach((disciplina) => {
        disciplinas.add(disciplina);
      });
    });

    return ordenarDisciplinasResultado(Array.from(disciplinas));
  }, [resultadosPorAluno]);

  const disciplinasResultado = resultado?.respostas_salvas
    ? calcularNotasDisciplinas(resumirPorDisciplina(resultado.respostas_salvas))
    : {};
  const gruposGabaritoDisponiveis = useMemo(() => {
    if (Number(serieGabarito) === 8 && Number(dia) === 1) {
      return GRUPOS_GABARITO;
    }

    return GRUPOS_GABARITO.filter((grupo) =>
      ["PADRAO", "SUBSTITUTIVA"].includes(grupo.codigo)
    );
  }, [serieGabarito, dia]);
  const gruposGabaritoCorrecao = useMemo(
    () => [
      { codigo: GABARITO_AUTOMATICO, nome: "Automatico da turma" },
      ...gruposGabaritoDisponiveis,
    ],
    [gruposGabaritoDisponiveis]
  );
  const alunoSelecionado = useMemo(
    () => alunos.find((aluno) => String(aluno.id) === String(alunoId)),
    [alunos, alunoId]
  );

  function extrairAcertos(dados) {
    return (
      dados?.acertos ??
      dados?.total_acertos ??
      dados?.quantidade_acertos ??
      dados?.qtd_acertos ??
      null
    );
  }

  function extrairNota(dados) {
    return dados?.nota_global ?? dados?.nota ?? null;
  }

  function extrairNotaDia(dados) {
    return dados?.nota_dia ?? null;
  }

  function formatarMedia(valor) {
    return Number.isFinite(valor) ? valor.toFixed(1).replace(".", ",") : "-";
  }

  function ehNotaBaixa(valor) {
    const numero = Number(String(valor ?? "").replace(",", "."));
    return Number.isFinite(numero) && numero < 5;
  }

  function classeNota(valor, classeBase = "") {
    return [classeBase, ehNotaBaixa(valor) ? "nota-baixa" : ""].filter(Boolean).join(" ");
  }

  function extrairSerieTurma(nomeTurma = "") {
    const digitos = String(nomeTurma).replace(/\D/g, "");
    return digitos ? Number(digitos) : null;
  }

  function normalizarDisciplina(disciplina = "") {
    return String(disciplina)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\./g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function normalizarDisciplinaResultado(disciplina = "") {
    const disciplinaNormalizada = normalizarDisciplina(disciplina);
    const equivalencias = {
      lp: "portugues",
      "lingua portuguesa": "portugues",
      portugues: "portugues",
      his: "historia",
      historia: "historia",
      geo: "geografia",
      geografia: "geografia",
      ef: "educacao fisica",
      "ed fisica": "educacao fisica",
      "educacao fisica": "educacao fisica",
      mat: "matematica",
      matematica: "matematica",
      cie: "ciencias",
      ciencias: "ciencias",
      artes: "artes",
      ingles: "ingles",
    };

    return equivalencias[disciplinaNormalizada] || disciplinaNormalizada;
  }

  function ordenarDisciplinasResultado(disciplinas = []) {
    return [...disciplinas].sort((a, b) => {
      const indiceA = ORDEM_DISCIPLINAS_RESULTADO.indexOf(normalizarDisciplinaResultado(a));
      const indiceB = ORDEM_DISCIPLINAS_RESULTADO.indexOf(normalizarDisciplinaResultado(b));
      const ordemA = indiceA === -1 ? ORDEM_DISCIPLINAS_RESULTADO.length : indiceA;
      const ordemB = indiceB === -1 ? ORDEM_DISCIPLINAS_RESULTADO.length : indiceB;

      if (ordemA !== ordemB) return ordemA - ordemB;

      return String(a).localeCompare(String(b));
    });
  }

  function obterCorDisciplina(disciplina = "") {
    if (CORES_DISCIPLINAS[disciplina]) return CORES_DISCIPLINAS[disciplina];

    const disciplinaNormalizada = normalizarDisciplina(disciplina);
    const chaveEncontrada = Object.keys(CORES_DISCIPLINAS).find(
      (chave) => normalizarDisciplina(chave) === disciplinaNormalizada
    );

    if (chaveEncontrada) return CORES_DISCIPLINAS[chaveEncontrada];

    const somaCaracteres = Array.from(disciplinaNormalizada).reduce(
      (soma, caractere) => soma + caractere.charCodeAt(0),
      0
    );

    return PALETA_DISCIPLINAS[somaCaracteres % PALETA_DISCIPLINAS.length];
  }

  function adicionarCodigoGabaritoCorrecao(formData, codigo = codigoGabaritoCorrecao) {
    if (codigo && codigo !== GABARITO_AUTOMATICO) {
      formData.append("codigo_gabarito", codigo);
    }
  }

  function obterResultadoDia(resultadoAluno, diaResultado) {
    return (
      resultadoAluno?.resultadosDias?.[diaResultado] ??
      resultadoAluno?.resultadosDias?.[String(diaResultado)] ??
      null
    );
  }

  function obterDiaDetalhePreferido(resultadoAluno) {
    if (obterResultadoDia(resultadoAluno, dia)) return dia;
    if (obterResultadoDia(resultadoAluno, 1)) return 1;
    if (obterResultadoDia(resultadoAluno, 2)) return 2;
    return dia;
  }

  function obterLinhasResultado(dados) {
    if (!dados) return [];
    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados.resultados)) return dados.resultados;
    if (Array.isArray(dados.alunos)) return dados.alunos;
    if (Array.isArray(dados.planilha)) return dados.planilha;

    return [dados];
  }

  function resultadoEhAdaptado(resultadoAluno) {
    return String(resultadoAluno?.codigoGabarito || "").toUpperCase() === "ADAPTADA";
  }

  function formatarDisciplinaResultado(resumo, resultadoAluno) {
    if (!resumo) return 0;

    return resumo.nota;
  }

  function resumirPorDisciplina(respostasSalvas = []) {
    return respostasSalvas.reduce((resumo, resposta) => {
      const disciplina = resposta.disciplina || "Sem disciplina";

      if (!resumo[disciplina]) {
        resumo[disciplina] = {
          acertos: 0,
          total: 0,
          nota: 0,
        };
      }

      resumo[disciplina].total += 1;

      if (resposta.acertou) {
        resumo[disciplina].acertos += 1;
      }

      return resumo;
    }, {});
  }

  function calcularNotasDisciplinas(disciplinas = {}) {
    return Object.fromEntries(
      Object.entries(disciplinas).map(([disciplina, resumo]) => [
        disciplina,
        {
          ...resumo,
          nota: resumo.total ? Number(((resumo.acertos / resumo.total) * 10).toFixed(1)) : 0,
        },
      ])
    );
  }

  function atualizarPlanilha(dados) {
    const linhasResultado = obterLinhasResultado(dados);

    setResultadosPorAluno((resultadosAtuais) => {
      const novosResultados = { ...resultadosAtuais };

      linhasResultado.forEach((linha) => {
        const id = linha.aluno_id ?? linha.id_aluno ?? linha.id ?? alunoId;
        if (!id) return;

        const disciplinas = calcularNotasDisciplinas(resumirPorDisciplina(linha.respostas_salvas));

        novosResultados[String(id)] = {
          acertos: extrairAcertos(linha),
          nota: extrairNota(linha),
          notaDia: extrairNotaDia(linha),
          disciplinas,
          acertosGlobal: linha.acertos_global,
          totalQuestoesGlobal: linha.total_questoes_global,
          resultadosDias: linha.resultados_dias || {},
          modeloProvaId: linha.modelo_prova_id,
          codigoGabarito: linha.codigo_gabarito,
          observacao: linha.observacao,
        };
      });

      return novosResultados;
    });
  }

  async function carregarEscolas() {
    try {
      const response = await api.get("/escolas");
      setEscolas(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar escolas");
    }
  }

  async function carregarModeloEGabarito() {
    setDisciplinasModelo([]);
    setGabaritoOficial({});
    setMensagemGabarito("");

    if (!escolaId) return;

    try {
      const modeloResponse = await api.get("/modelo-prova", {
        params: { escola_id: escolaId, bimestre, dia },
      });

      setDisciplinasModelo(modeloResponse.data.disciplinas || []);

      try {
        const gabaritoResponse = await api.get("/gabarito", {
          params: {
            escola_id: escolaId,
            bimestre,
            dia,
            serie: serieGabarito,
            codigo_gabarito: codigoGabarito,
          },
        });

        const respostas = {};
        gabaritoResponse.data.forEach((questao) => {
          respostas[questao.numero_questao] = questao.resposta_correta;
        });

        setGabaritoOficial(respostas);
        setMensagemGabarito(
          Object.keys(respostas).length > 0
            ? "Gabarito oficial carregado"
            : "Nenhum gabarito oficial salvo"
        );
      } catch (error) {
        if (error.response?.status === 404) {
          setMensagemGabarito("Nenhum gabarito oficial salvo");
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error(error);
      setMensagemGabarito("Modelo de prova não encontrado para essa seleção");
    }
  }

  async function salvarGabaritoOficial() {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    if (questoesModelo.length === 0) {
      alert("Modelo de prova não encontrado para essa seleção.");
      return;
    }

    const respostas = questoesModelo.map((questao) => gabaritoOficial[questao.numero]);

    if (respostas.some((resposta) => !resposta)) {
      alert("Preencha todas as respostas do gabarito.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", dia);
      formData.append("serie", serieGabarito);
      formData.append("codigo_gabarito", codigoGabarito);
      formData.append("respostas", respostas.join(","));

      const response = await api.post("/gabarito", formData);
      const recalculados = response.data.resultados_recalculados || 0;
      setMensagemGabarito(
        `${response.data.mensagem}: ${response.data.total_questoes} questões, ${recalculados} correções recalculadas`
      );
      alert(`Gabarito oficial salvo com sucesso! Correções recalculadas: ${recalculados}`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao salvar gabarito");
    }
  }

  async function carregarTurmas(idEscola) {
    if (!idEscola) return;

    try {
      const response = await api.get(`/turmas/${idEscola}`);
      setTurmas(response.data);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar turmas");
    }
  }

  async function carregarAlunos(idTurma) {
    if (!idTurma) return;

    try {
      const response = await api.get(`/alunos/${idTurma}`);
      setAlunos(response.data);
      setResultadosPorAluno({});
      setDetalheAluno(null);
      setCorrecaoAlunoAtual(null);
      await carregarResultadosSalvos(idTurma);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar alunos");
    }
  }

  async function carregarResultadosSalvos(idTurma = turmaId) {
    if (!escolaId || !idTurma) return;

    try {
      const response = await api.get("/resultados-alunos", {
        params: { turma_id: idTurma, escola_id: escolaId, bimestre },
      });

      setResultadosPorAluno({});
      atualizarPlanilha(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setResultadosPorAluno({});
        return;
      }

      console.error(error);
    }
  }

  async function carregarComparacaoTurmas() {
    if (!escolaId || turmas.length === 0) {
      setComparacaoTurmas([]);
      return;
    }

    setCarregandoComparacaoTurmas(true);

    try {
      const comparacoes = await Promise.all(
        turmas.map(async (turma) => {
          const [alunosResponse, resultadosResponse] = await Promise.all([
            api.get(`/alunos/${turma.id}`),
            api
              .get("/resultados-alunos", {
                params: { turma_id: turma.id, escola_id: escolaId, bimestre },
              })
              .catch((error) => {
                if (error.response?.status === 404) return { data: [] };
                throw error;
              }),
          ]);

          const linhas = obterLinhasResultado(resultadosResponse.data);
          const resultadoPorAluno = {};

          linhas.forEach((linha) => {
            const id = linha.aluno_id ?? linha.id_aluno ?? linha.id;
            if (!id) return;

            resultadoPorAluno[String(id)] = {
              nota: extrairNota(linha),
              disciplinas: calcularNotasDisciplinas(resumirPorDisciplina(linha.respostas_salvas)),
            };
          });

          return calcularResumoTurma(turma, alunosResponse.data, resultadoPorAluno);
        })
      );

      setComparacaoTurmas(
        comparacoes.sort((a, b) => a.turma.nome.localeCompare(b.turma.nome))
      );
    } catch (error) {
      console.error(error);
      setComparacaoTurmas([]);
    } finally {
      setCarregandoComparacaoTurmas(false);
    }
  }

  async function baixarResultadoFinalExcel() {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    try {
      const response = await api.get("/resultado-final-xlsx", {
        params: { escola_id: escolaId, bimestre },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `resultado_final_${bimestre}_bimestre.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar resultado final.");
    }
  }

  async function editarNotaAluno(aluno, diaNota, notaAtual) {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    const valor = prompt(
      `Informe a nova nota do Dia ${diaNota} para ${aluno.nome}`,
      notaAtual !== null && notaAtual !== undefined ? String(notaAtual).replace(".", ",") : ""
    );

    if (valor === null) return;

    const nota = Number(valor.replace(",", "."));
    if (Number.isNaN(nota) || nota < 0 || nota > 10) {
      alert("Informe uma nota entre 0 e 10.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("aluno_id", aluno.id);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", diaNota);
      formData.append("nota", nota);

      await api.patch("/nota-aluno", formData);
      await carregarResultadosSalvos(turmaId);
      if (detalheAluno?.aluno?.id === aluno.id && detalheAluno?.dia === diaNota) {
        await abrirDetalheAluno(aluno, diaNota, true);
      }
      alert("Nota atualizada com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao editar nota.");
    }
  }

  async function editarAcertosAluno(aluno, diaNota, acertosAtuais, totalQuestoes) {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    const valor = prompt(
      `Informe a nova quantidade de acertos do Dia ${diaNota} para ${aluno.nome}`,
      acertosAtuais !== null && acertosAtuais !== undefined ? String(acertosAtuais) : ""
    );

    if (valor === null) return;

    const acertos = Number(valor);
    if (!Number.isInteger(acertos) || acertos < 0 || acertos > totalQuestoes) {
      alert(`Informe um número inteiro entre 0 e ${totalQuestoes}.`);
      return;
    }

    try {
      const formData = new FormData();

      formData.append("aluno_id", aluno.id);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", diaNota);
      formData.append("acertos", acertos);

      await api.patch("/acertos-aluno", formData);
      await carregarResultadosSalvos(turmaId);
      await abrirDetalheAluno(aluno, diaNota, true);

      if (String(alunoId) === String(aluno.id) && Number(dia) === Number(diaNota)) {
        await carregarCorrecaoAlunoSelecionado();
      }

      alert("Acertos atualizados com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao editar acertos.");
    }
  }

  async function editarGabaritoAluno(aluno, diaNota, dadosCorrecao) {
    const respostasAtuais = dadosCorrecao?.respostas_salvas || [];

    if (respostasAtuais.length === 0) {
      alert("Este aluno nao tem respostas salvas para editar.");
      return;
    }

    const respostasTexto = respostasAtuais
      .map((resposta) => resposta.resposta_aluno || "")
      .join(",");
    const valor = prompt(
      `Edite as respostas do Dia ${diaNota} para ${aluno.nome}`,
      respostasTexto
    );

    if (valor === null) return;

    try {
      const formData = new FormData();

      formData.append("aluno_id", aluno.id);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", diaNota);
      formData.append("respostas", valor.toUpperCase());
      adicionarCodigoGabaritoCorrecao(formData, dadosCorrecao?.codigo_gabarito);

      const response = await api.post("/corrigir-manual", formData);

      setResultado(response.data);
      atualizarPlanilha(response.data);
      await carregarResultadosSalvos(turmaId);
      await abrirDetalheAluno(aluno, diaNota, true);

      if (String(alunoId) === String(aluno.id) && Number(dia) === Number(diaNota)) {
        await carregarCorrecaoAlunoSelecionado();
      }

      alert("Respostas do aluno atualizadas com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao editar respostas do aluno.");
    }
  }

  async function carregarDisciplinasDia(diaNota) {
    if (diaNota === dia && disciplinasModelo.length > 0) {
      return disciplinasModelo;
    }

    const response = await api.get("/modelo-prova", {
      params: { escola_id: escolaId, bimestre, dia: diaNota },
    });

    return response.data.disciplinas || [];
  }

  async function salvarProvaAdaptada(aluno, diaNota = dia) {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    try {
      const disciplinas = await carregarDisciplinasDia(diaNota);

      if (disciplinas.length === 0) {
        alert("Modelo de prova nao encontrado para esse dia.");
        return;
      }

      const acertosDisciplinas = {};

      for (const disciplina of disciplinas) {
        const valor = prompt(
          `Acertos em ${disciplina.disciplina} (${disciplina.quantidade_questoes} questões) - ${aluno.nome}`,
          "0"
        );

        if (valor === null) return;

        const acertos = Number(valor.replace(",", "."));
        if (!Number.isInteger(acertos) || acertos < 0 || acertos > disciplina.quantidade_questoes) {
          alert(`Informe um número inteiro entre 0 e ${disciplina.quantidade_questoes}.`);
          return;
        }

        acertosDisciplinas[disciplina.disciplina] = acertos;
      }

      const formData = new FormData();

      formData.append("aluno_id", aluno.id);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", diaNota);
      formData.append("acertos_disciplinas", JSON.stringify(acertosDisciplinas));

      const response = await api.patch("/nota-adaptada", formData);

      atualizarPlanilha(response.data);
      await carregarResultadosSalvos(turmaId);

      if (detalheAluno?.aluno?.id === aluno.id && detalheAluno?.dia === diaNota) {
        await abrirDetalheAluno(aluno, diaNota, true);
      }

      alert("Prova adaptada salva com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao salvar prova adaptada.");
    }
  }

  async function iniciarAdaptadaInline(aluno, diaNota = dia) {
    if (!escolaId) {
      alert("Selecione uma escola.");
      return;
    }

    try {
      const disciplinas = await carregarDisciplinasDia(diaNota);

      if (disciplinas.length === 0) {
        alert("Modelo de prova nao encontrado para esse dia.");
        return;
      }

      setAdaptadaInline({
        alunoId: aluno.id,
        dia: diaNota,
        disciplinas,
        valores: Object.fromEntries(
          disciplinas.map((disciplina) => [disciplina.disciplina, ""])
        ),
      });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao carregar disciplinas.");
    }
  }

  function atualizarAdaptadaInline(disciplina, valor) {
    setAdaptadaInline((estadoAtual) => {
      if (!estadoAtual) return estadoAtual;

      return {
        ...estadoAtual,
        valores: {
          ...estadoAtual.valores,
          [disciplina]: valor.replace(/\D/g, ""),
        },
      };
    });
  }

  async function salvarAdaptadaInline(aluno) {
    if (!adaptadaInline || String(adaptadaInline.alunoId) !== String(aluno.id)) return;

    const acertosDisciplinas = {};

    for (const disciplina of adaptadaInline.disciplinas) {
      const valor = adaptadaInline.valores[disciplina.disciplina];
      const acertos = Number(valor);

      if (valor === "" || !Number.isInteger(acertos) || acertos < 0 || acertos > disciplina.quantidade_questoes) {
        alert(`Informe acertos de ${disciplina.disciplina} entre 0 e ${disciplina.quantidade_questoes}.`);
        return;
      }

      acertosDisciplinas[disciplina.disciplina] = acertos;
    }

    try {
      const formData = new FormData();

      formData.append("aluno_id", aluno.id);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", adaptadaInline.dia);
      formData.append("acertos_disciplinas", JSON.stringify(acertosDisciplinas));

      const response = await api.patch("/nota-adaptada", formData);

      setResultado(response.data);
      atualizarPlanilha(response.data);
      await carregarResultadosSalvos(turmaId);
      setAdaptadaInline(null);

      if (detalheAluno?.aluno?.id === aluno.id && detalheAluno?.dia === adaptadaInline.dia) {
        await abrirDetalheAluno(aluno, adaptadaInline.dia, true);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao salvar prova adaptada.");
    }
  }

  async function abrirDetalheAluno(aluno, diaDetalhe = dia, forcar = false) {
    const resultadoAluno = resultadosPorAluno[String(aluno.id)];
    const resultadoDia = obterResultadoDia(resultadoAluno, diaDetalhe);

    const temResultado = Boolean(resultadoDia) || resultadoAluno?.acertos !== undefined || resultadoAluno?.nota !== undefined;

    if (!forcar && !temResultado) {
      return;
    }

    setCarregandoDetalheAluno(true);

    try {
      const response = await api.get("/respostas-aluno", {
        params: {
          aluno_id: aluno.id,
          escola_id: escolaId,
          bimestre,
          dia: diaDetalhe,
        },
      });

      setDetalheAluno({
        aluno,
        dia: diaDetalhe,
        dados: response.data,
      });
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao carregar detalhes da correção.");
    } finally {
      setCarregandoDetalheAluno(false);
    }
  }

  async function carregarCorrecaoAlunoSelecionado() {
    if (!alunoId || !escolaId) {
      setCorrecaoAlunoAtual(null);
      return;
    }

    const resultadoAluno = resultadosPorAluno[String(alunoId)];
    const resultadoDia = obterResultadoDia(resultadoAluno, dia);

    if (!resultadoDia) {
      setCorrecaoAlunoAtual(null);
      return;
    }

    setCarregandoCorrecaoAlunoAtual(true);

    try {
      const response = await api.get("/respostas-aluno", {
        params: {
          aluno_id: alunoId,
          escola_id: escolaId,
          bimestre,
          dia,
        },
      });

      setCorrecaoAlunoAtual(response.data);
    } catch (error) {
      console.error(error);
      setCorrecaoAlunoAtual(null);
    } finally {
      setCarregandoCorrecaoAlunoAtual(false);
    }
  }

  async function excluirCorrecaoAluno(alvo = detalheAluno) {
    if (!alvo) return;

    const alunoAlvo = alvo.aluno || alunos.find((aluno) => String(aluno.id) === String(alvo.aluno_id));
    const diaAlvo = alvo.dia ?? dia;

    if (!alunoAlvo) return;

    const confirmado = window.confirm(
      `Excluir a correção do Dia ${diaAlvo} de ${alunoAlvo.nome}?`
    );

    if (!confirmado) return;

    try {
      await api.delete("/correcao-aluno", {
        params: {
          aluno_id: alunoAlvo.id,
          escola_id: escolaId,
          bimestre,
          dia: diaAlvo,
        },
      });

      if (detalheAluno?.aluno?.id === alunoAlvo.id && detalheAluno?.dia === diaAlvo) {
        setDetalheAluno(null);
      }
      if (String(alunoId) === String(alunoAlvo.id) && Number(dia) === Number(diaAlvo)) {
        setCorrecaoAlunoAtual(null);
      }
      await carregarResultadosSalvos(turmaId);
      alert("Correção excluída com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao excluir correção.");
    }
  }

  async function enviarFoto() {
    if (!escolaId || !turmaId || !alunoId || !foto) {
      alert("Selecione escola, turma, aluno e foto.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("aluno_id", alunoId);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", dia);
      adicionarCodigoGabaritoCorrecao(formData);
      formData.append("foto", foto);

      const response = await api.post("/corrigir-foto", formData);

      setResultado(response.data);
      atualizarPlanilha(response.data);
      await carregarResultadosSalvos(turmaId);
      setAlunoId("");
      setFoto(null);

      if (fotoInputRef.current) {
        fotoInputRef.current.value = "";
      }

      alert("Foto enviada e correção concluída com sucesso!");
    } catch (error) {
      console.error(error);

      if (error.response?.data?.detail) {
        const detalhe = error.response.data.detail;
        alert(typeof detalhe === "string" ? detalhe : detalhe.mensagem);
      } else {
        alert("Erro ao enviar foto");
      }
    }
  }

  async function corrigirManual() {
    if (!escolaId || !turmaId || !alunoId || !respostasManuais.trim()) {
      alert("Selecione escola, turma, aluno e informe as respostas.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("aluno_id", alunoId);
      formData.append("escola_id", escolaId);
      formData.append("bimestre", bimestre);
      formData.append("dia", dia);
      formData.append("respostas", respostasManuais);
      adicionarCodigoGabaritoCorrecao(formData);

      const response = await api.post("/corrigir-manual", formData);

      setResultado(response.data);
      atualizarPlanilha(response.data);
      await carregarResultadosSalvos(turmaId);
      setRespostasManuais("");

      alert("Correção manual concluída com sucesso!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Erro ao corrigir manualmente.");
    }
  }

  function trocarEscola(idEscola) {
    setEscolaId(idEscola);
    setTurmaId("");
    setAlunoId("");
    setTurmas([]);
    setAlunos([]);
    setResultado(null);
    setResultadosPorAluno({});
    setComparacaoTurmas([]);
    setCarregandoComparacaoTurmas(false);
    setDetalheAluno(null);
    setCorrecaoAlunoAtual(null);
    carregarTurmas(idEscola);
  }

  function entrar(event) {
    event.preventDefault();

    if (emailLogin.trim().toLowerCase() !== EMAIL_LOGIN || senhaLogin !== SENHA_LOGIN) {
      setErroLogin("E-mail ou senha inválidos.");
      return;
    }

    localStorage.setItem("corretor-gabarito-logado", "true");
    setLogado(true);
    setErroLogin("");
    setSenhaLogin("");
  }

  function sair() {
    localStorage.removeItem("corretor-gabarito-logado");
    setLogado(false);
    setEmailLogin("");
    setSenhaLogin("");
    setErroLogin("");
  }

  function renderizarTabelaResultadoFinal() {
    if (alunos.length === 0) {
      return <p className="texto-vazio">Selecione uma turma para ver o resultado final.</p>;
    }

    const alunosComStatus = alunos.map((aluno) => {
      const resultadoAluno = resultadosPorAluno[String(aluno.id)];
      const acertos = resultadoAluno?.acertos ?? extrairAcertos(aluno);
      const temAcertos = acertos !== null && acertos !== undefined;

      return { aluno, resultadoAluno, temAcertos };
    });
    const totalCorrigidos = alunosComStatus.filter(({ temAcertos }) => temAcertos).length;
    const totalPendentes = alunosComStatus.length - totalCorrigidos;
    const termoBusca = buscaResultado.trim().toLowerCase();
    const alunosFiltrados = alunosComStatus.filter(({ aluno, temAcertos }) => {
      const textoAluno = `${aluno.numero_chamada ?? ""} ${aluno.nome ?? ""}`.toLowerCase();
      const passaBusca = !termoBusca || textoAluno.includes(termoBusca);
      const passaStatus =
        filtroStatusResultado === "todos" ||
        (filtroStatusResultado === "corrigidos" && temAcertos) ||
        (filtroStatusResultado === "pendentes" && !temAcertos);

      return passaBusca && passaStatus;
    });
    const disciplinasResultadoFinal = disciplinasPlanilha.length > 0
      ? disciplinasPlanilha
      : ordenarDisciplinasResultado(disciplinasModelo.map((disciplina) => disciplina.disciplina));

    return (
      <section className="planilha">
        <div className="planilha-cabecalho">
          <h2>Resultado final do bimestre</h2>
          <span>{alunosFiltrados.length} de {alunos.length} aluno(s)</span>
        </div>

        <div className="resultado-resumo">
          <div>
            <strong>Total</strong>
            <span>{alunos.length}</span>
          </div>
          <div>
            <strong>Corrigidos</strong>
            <span>{totalCorrigidos}</span>
          </div>
          <div>
            <strong>Pendentes</strong>
            <span>{totalPendentes}</span>
          </div>
        </div>

        <div className="resultado-filtros">
          <div className="campo">
            <label>Buscar aluno</label>
            <input
              type="search"
              value={buscaResultado}
              onChange={(event) => setBuscaResultado(event.target.value)}
              placeholder="Nome ou número"
            />
          </div>

          <div className="campo">
            <label>Status</label>
            <select
              value={filtroStatusResultado}
              onChange={(event) => setFiltroStatusResultado(event.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="corrigidos">Corrigidos</option>
              <option value="pendentes">Pendentes</option>
            </select>
          </div>
        </div>

        {alunosFiltrados.length === 0 ? (
          <p className="texto-vazio">Nenhum aluno encontrado com esses filtros.</p>
        ) : (
        <div className="tabela-wrapper tabela-wrapper-final">
          <table className="tabela-resultado-final">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Aluno</th>
                {disciplinasResultadoFinal.map((disciplina) => (
                  <th key={disciplina}>{disciplina}</th>
                ))}
                <th>Média geral</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {alunosFiltrados.map(({ aluno, resultadoAluno, temAcertos }) => {
                const nota = resultadoAluno?.nota ?? extrairNota(aluno) ?? 0;
                const diaDetalhePreferido = obterDiaDetalhePreferido(resultadoAluno);
                const editandoAdaptada = String(adaptadaInline?.alunoId) === String(aluno.id);

                return (
                  <tr
                    key={aluno.id}
                    className={temAcertos && !editandoAdaptada ? "linha-clicavel" : ""}
                    onClick={() => {
                      if (!editandoAdaptada) {
                        abrirDetalheAluno(aluno, diaDetalhePreferido);
                      }
                    }}
                  >
                    <td>{aluno.numero_chamada ?? "-"}</td>
                    <td>{aluno.nome}</td>

                    {disciplinasResultadoFinal.map((disciplina) => {
                      const resumo = resultadoAluno?.disciplinas?.[disciplina];
                      const disciplinaAdaptada = adaptadaInline?.disciplinas?.find(
                        (item) => normalizarDisciplina(item.disciplina) === normalizarDisciplina(disciplina)
                      );

                      if (editandoAdaptada && disciplinaAdaptada) {
                        return (
                          <td key={disciplina}>
                            <input
                              className="input-acertos-adaptada"
                              type="number"
                              min="0"
                              max={disciplinaAdaptada.quantidade_questoes}
                              placeholder="0"
                              value={adaptadaInline.valores[disciplinaAdaptada.disciplina] ?? ""}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                atualizarAdaptadaInline(
                                  disciplinaAdaptada.disciplina,
                                  event.target.value
                                )
                              }
                            />
                            <span className="total-acertos-adaptada">
                              /{disciplinaAdaptada.quantidade_questoes}
                            </span>
                          </td>
                        );
                      }

                      const notaDisciplina = formatarDisciplinaResultado(resumo, resultadoAluno);

                      return (
                        <td key={disciplina} className={classeNota(notaDisciplina)}>
                          {notaDisciplina}
                        </td>
                      );
                    })}

                    <td className={classeNota(nota, "nota-global")}>{nota}</td>
                    <td>
                      <div className="acoes-status">
                        <span className={temAcertos ? "status corrigido" : "status pendente"}>
                          {resultadoEhAdaptado(resultadoAluno)
                            ? "Adaptada"
                            : temAcertos
                              ? "Corrigido"
                              : "Pendente"}
                        </span>
                        <button
                          className="botao-adaptada"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (editandoAdaptada) {
                              salvarAdaptadaInline(aluno);
                            } else {
                              iniciarAdaptadaInline(aluno, dia);
                            }
                          }}
                        >
                          {editandoAdaptada ? "Salvar" : "Adaptada"}
                        </button>
                        {editandoAdaptada && (
                          <button
                            className="botao-cancelar-inline"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setAdaptadaInline(null);
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </section>
    );
  }

  function calcularResumoTurma(turma, alunosTurma, resultadosTurma) {
    const totaisDisciplinas = {};
    let somaGeral = 0;
    let alunosComNotaGeral = 0;

    alunosTurma.forEach((aluno) => {
      const resultadoAluno = resultadosTurma[String(aluno.id)];
      if (!resultadoAluno) return;

      const notaGeral = extrairNota(resultadoAluno);
      const notaGeralNumero = Number(notaGeral);
      if (Number.isFinite(notaGeralNumero)) {
        somaGeral += notaGeralNumero;
        alunosComNotaGeral += 1;
      }

      Object.entries(resultadoAluno.disciplinas || {}).forEach(([disciplina, resumo]) => {
        const notaDisciplina = resumo?.nota;
        const notaDisciplinaNumero = Number(notaDisciplina);
        if (!Number.isFinite(notaDisciplinaNumero)) return;

        if (!totaisDisciplinas[disciplina]) {
          totaisDisciplinas[disciplina] = { soma: 0, quantidade: 0 };
        }

        totaisDisciplinas[disciplina].soma += notaDisciplinaNumero;
        totaisDisciplinas[disciplina].quantidade += 1;
      });
    });

    const mediasDisciplinas = Object.entries(totaisDisciplinas)
      .map(([disciplina, dados]) => ({
        disciplina,
        media: dados.quantidade ? dados.soma / dados.quantidade : null,
        quantidade: dados.quantidade,
      }))
      .sort((a, b) => a.disciplina.localeCompare(b.disciplina));

    return {
      turma,
      mediasDisciplinas,
      mediaGeral: alunosComNotaGeral ? somaGeral / alunosComNotaGeral : null,
      alunosComNotaGeral,
      totalAlunos: alunosTurma.length,
    };
  }

  function renderizarAnaliseDados() {
    if (!escolaId) {
      return <p className="texto-vazio">Selecione uma escola para ver a análise de dados.</p>;
    }

    if (carregandoComparacaoTurmas) {
      return <p className="texto-vazio">Carregando gráficos da escola...</p>;
    }

    if (comparacaoTurmas.length === 0) {
      return <p className="texto-vazio">Ainda nao ha turmas com dados para esta escola.</p>;
    }

    const escolaSelecionada = escolas.find((escola) => String(escola.id) === String(escolaId));
    const turmasComNota = comparacaoTurmas.filter((resumo) => Number.isFinite(resumo.mediaGeral));
    const mediaGeralEscola = turmasComNota.length
      ? turmasComNota.reduce((soma, resumo) => soma + resumo.mediaGeral, 0) / turmasComNota.length
      : null;
    const totalAlunos = comparacaoTurmas.reduce((total, resumo) => total + resumo.totalAlunos, 0);
    const totalAlunosComNota = comparacaoTurmas.reduce(
      (total, resumo) => total + resumo.alunosComNotaGeral,
      0
    );
    const disciplinasComparacao = Array.from(
      new Set(
        comparacaoTurmas.flatMap((turma) =>
          turma.mediasDisciplinas.map((disciplina) => disciplina.disciplina)
        )
      )
    ).sort((a, b) => a.localeCompare(b));
    const turmasPorAno = comparacaoTurmas.reduce((grupos, resumo) => {
      const serie = extrairSerieTurma(resumo.turma.nome) || "Sem ano";
      grupos[serie] = grupos[serie] || [];
      grupos[serie].push(resumo);
      return grupos;
    }, {});

    return (
      <div className="analise-dados">
        <div className="resultado-resumo">
          <div>
            <strong>Escola</strong>
            <span>{escolaSelecionada?.nome || "-"}</span>
          </div>
          <div>
            <strong>Média geral</strong>
            <span>{formatarMedia(mediaGeralEscola)}</span>
          </div>
          <div>
            <strong>Alunos com nota</strong>
            <span>{totalAlunosComNota}/{totalAlunos}</span>
          </div>
        </div>

        <div className="graficos-turmas-grid">
          {comparacaoTurmas.map((resumo) => (
            <div className="grafico-sala" key={resumo.turma.id}>
              <h3>{resumo.turma.nome}</h3>

              {resumo.mediasDisciplinas.length === 0 ? (
                <p className="texto-vazio">Sem notas por disciplina.</p>
              ) : (
                <div className="grafico-disciplinas">
                  {resumo.mediasDisciplinas.map(({ disciplina, media }) => (
                    <div className="disciplina-coluna" key={disciplina}>
                      <div className="disciplina-coluna-trilho">
                        <span
                          style={{
                            background: obterCorDisciplina(disciplina),
                            height: `${Math.max(4, ((media || 0) / 10) * 100)}%`,
                          }}
                        >
                          {formatarMedia(media)}
                        </span>
                      </div>
                      <small>{disciplina}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="comparacao-turmas">
          <div className="planilha-cabecalho">
            <h2>Média global por sala</h2>
            <span>{comparacaoTurmas.length} turma(s)</span>
          </div>

          <div className="grafico-bloco grafico-global">
            <div className="grafico-colunas">
              {comparacaoTurmas.map((resumo) => (
                <div className="coluna-item" key={resumo.turma.id}>
                  <div className="coluna-trilho">
                    <span
                      style={{
                        height: `${Math.max(4, ((resumo.mediaGeral || 0) / 10) * 100)}%`,
                      }}
                    >
                      {formatarMedia(resumo.mediaGeral)}
                    </span>
                  </div>
                  <small>{resumo.turma.nome}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="tabela-wrapper tabela-analise-wrapper">
            <table className="tabela-comparacao">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Média geral</th>
                  {disciplinasComparacao.map((disciplina) => (
                    <th key={disciplina}>{disciplina}</th>
                  ))}
                  <th>Alunos considerados</th>
                </tr>
              </thead>
              <tbody>
                {comparacaoTurmas.map((resumo) => (
                  <tr key={resumo.turma.id}>
                    <td>{resumo.turma.nome}</td>
                    <td className="nota-global">{formatarMedia(resumo.mediaGeral)}</td>
                    {disciplinasComparacao.map((disciplina) => {
                      const mediaDisciplina = resumo.mediasDisciplinas.find(
                        (item) => item.disciplina === disciplina
                      );

                      return <td key={disciplina}>{formatarMedia(mediaDisciplina?.media)}</td>;
                    })}
                    <td>{resumo.alunosComNotaGeral}/{resumo.totalAlunos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="comparacao-turmas">
          <div className="planilha-cabecalho">
            <h2>Comparação entre turmas do mesmo ano</h2>
            <span>Agrupado por ano</span>
          </div>

          <div className="comparacao-anos">
            {Object.entries(turmasPorAno).map(([serie, resumos]) => (
              <div className="grafico-bloco" key={serie}>
                <h3>{serie === "Sem ano" ? "Sem ano identificado" : `${serie}º ano`}</h3>
                <div className="grafico-colunas">
                  {resumos.map((resumo) => (
                    <div className="coluna-item" key={resumo.turma.id}>
                      <div className="coluna-trilho">
                        <span
                          style={{
                            height: `${Math.max(4, ((resumo.mediaGeral || 0) / 10) * 100)}%`,
                          }}
                        >
                          {formatarMedia(resumo.mediaGeral)}
                        </span>
                      </div>
                      <small>{resumo.turma.nome}</small>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <main className="login-pagina">
        <form className="login-card" onSubmit={entrar}>
          <h1>Sistema de Correção de Gabaritos</h1>
          <h2>Login do professor</h2>

          <div className="campo">
            <label>E-mail</label>
            <input
              type="email"
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="campo">
            <label>Senha</label>
            <input
              type="password"
              value={senhaLogin}
              onChange={(e) => setSenhaLogin(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {erroLogin && <p className="erro-login">{erroLogin}</p>}

          <button type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <div className="container">
      <div className="topo-sistema">
        <h1>Sistema de Correção de Gabaritos</h1>
        <button className="botao-sair" type="button" onClick={sair}>
          Sair
        </button>
      </div>

      <nav className="navegacao" aria-label="Páginas">
        <button
          className={paginaAtual === "corrigir" ? "aba ativa" : "aba"}
          onClick={() => setPaginaAtual("corrigir")}
          type="button"
        >
          Corrigir cartões
        </button>

        <button
          className={paginaAtual === "gabarito" ? "aba ativa" : "aba"}
          onClick={() => setPaginaAtual("gabarito")}
          type="button"
        >
          Gabaritos oficiais
        </button>

        <button
          className={paginaAtual === "resultado" ? "aba ativa" : "aba"}
          onClick={() => setPaginaAtual("resultado")}
          type="button"
        >
          Resultado final
        </button>

        <button
          className={paginaAtual === "analise" ? "aba ativa" : "aba"}
          onClick={() => setPaginaAtual("analise")}
          type="button"
        >
          Análise de dados
        </button>
      </nav>

      <section className="secao">
        <h2>Dados da prova</h2>

        <div className="grade-controles">
          <div className="campo">
            <label>Escola</label>

            <select value={escolaId} onChange={(e) => trocarEscola(e.target.value)}>
              <option value="">Selecione</option>

              {escolas.map((escola) => (
                <option key={escola.id} value={escola.id}>
                  {escola.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Bimestre</label>

            <select
              value={bimestre}
              onChange={(e) => {
                setBimestre(e.target.value);
                setResultado(null);
                setCorrecaoAlunoAtual(null);
              }}
            >
              <option value={1}>1º Bimestre</option>
              <option value={2}>2º Bimestre</option>
              <option value={3}>3º Bimestre</option>
              <option value={4}>4º Bimestre</option>
            </select>
          </div>

          {paginaAtual === "analise" || paginaAtual === "resultado" ? (
            <div className="campo campo-info-analise">
              <label>Período</label>
              <div>Geral por bimestre</div>
            </div>
          ) : (
            <div className="campo">
              <label>Dia da prova</label>

              <select
                value={dia}
                onChange={(e) => {
                  const novoDia = e.target.value;
                  setDia(novoDia);
                  if (Number(novoDia) !== 1 && ["8AC", "8B"].includes(codigoGabarito)) {
                    setCodigoGabarito("PADRAO");
                  }
                  setResultado(null);
                  setCorrecaoAlunoAtual(null);
                }}
              >
                <option value={1}>Dia 1</option>
                <option value={2}>Dia 2</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {paginaAtual === "gabarito" && (
        <section className="secao pagina">
          <div className="planilha-cabecalho">
            <h2>Cadastrar gabarito oficial</h2>
            {mensagemGabarito && <span>{mensagemGabarito}</span>}
          </div>

          <div className="campo campo-serie">
            <label>Série</label>
            <select
              value={serieGabarito}
              onChange={(e) => {
                const novaSerie = Number(e.target.value);
                setSerieGabarito(novaSerie);
                if (novaSerie !== 8 && ["8AC", "8B"].includes(codigoGabarito)) {
                  setCodigoGabarito("PADRAO");
                }
              }}
            >
              {SERIES.map((serie) => (
                <option key={serie} value={serie}>
                  {serie}º ano
                </option>
              ))}
            </select>
          </div>

          <div className="campo campo-grupo-gabarito">
            <label>Tipo de gabarito</label>
            <select
              value={codigoGabarito}
              onChange={(e) => setCodigoGabarito(e.target.value)}
            >
              {gruposGabaritoDisponiveis.map((grupo) => (
                <option key={grupo.codigo} value={grupo.codigo}>
                  {grupo.nome}
                </option>
              ))}
            </select>
          </div>

          {questoesModelo.length > 0 ? (
            <>
              <div className="gabarito-grid">
                {disciplinasModelo.map((disciplina) => {
                  const questoesDisciplina = questoesModelo.filter(
                    (questao) => questao.disciplina === disciplina.disciplina
                  );

                  return (
                    <div className="disciplina-bloco" key={disciplina.id}>
                      <h3>{disciplina.disciplina}</h3>

                      <div className="questoes-grid">
                        {questoesDisciplina.map((questao) => (
                          <label className="questao-gabarito" key={questao.numero}>
                            <span>{questao.numero}</span>

                            <select
                              value={gabaritoOficial[questao.numero] || ""}
                              onChange={(e) => {
                                setGabaritoOficial((respostasAtuais) => ({
                                  ...respostasAtuais,
                                  [questao.numero]: e.target.value,
                                }));
                              }}
                            >
                              <option value="">-</option>
                              {ALTERNATIVAS.map((alternativa) => (
                                <option key={alternativa} value={alternativa}>
                                  {alternativa}
                                </option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="botao-secundario" onClick={salvarGabaritoOficial}>
                Salvar gabarito oficial
              </button>
            </>
          ) : (
            <p className="texto-vazio">Selecione escola, bimestre e dia para carregar o modelo.</p>
          )}
        </section>
      )}

      {paginaAtual === "corrigir" && (
        <>
          <section className="secao pagina">
            <h2>Corrigir cartão-resposta</h2>

            <div className="grade-controles">
              <div className="campo">
                <label>Turma</label>

                <select
                  value={turmaId}
                  onChange={(e) => {
                    setTurmaId(e.target.value);
                    setAlunoId("");
                    setAlunos([]);
                    setResultado(null);
                    setResultadosPorAluno({});
                    setCorrecaoAlunoAtual(null);
                    carregarAlunos(e.target.value);
                  }}
                >
                  <option value="">Selecione</option>

                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>Aluno</label>

                <select
                  value={alunoId}
                  onChange={(e) => {
                    setAlunoId(e.target.value);
                    setResultado(null);
                    setCorrecaoAlunoAtual(null);
                  }}
                >
                  <option value="">Selecione</option>

                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.numero_chamada} - {aluno.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>Foto do Gabarito</label>

                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    setFoto(e.target.files[0]);
                    setResultado(null);
                  }}
                />
              </div>

              <div className="campo">
                <label>Gabarito usado</label>
                <select
                  value={codigoGabaritoCorrecao}
                  onChange={(e) => setCodigoGabaritoCorrecao(e.target.value)}
                >
                  {gruposGabaritoCorrecao.map((grupo) => (
                    <option key={grupo.codigo} value={grupo.codigo}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {carregandoCorrecaoAlunoAtual && (
              <p className="texto-vazio">Carregando correção salva...</p>
            )}

            {correcaoAlunoAtual && (
              <div className="correcao-existente">
                <div className="correcao-existente-cabecalho">
                  <div>
                    <strong>Correção já salva para este aluno</strong>
                    <span>Dia {correcaoAlunoAtual.dia} - {bimestre}º bimestre</span>
                  </div>

                  <div className="correcao-existente-acoes">
                    <button
                      type="button"
                      onClick={() => {
                        const alunoSelecionado = alunos.find(
                          (aluno) => String(aluno.id) === String(alunoId)
                        );
                        if (alunoSelecionado) {
                          abrirDetalheAluno(alunoSelecionado, dia, true);
                        }
                      }}
                    >
                      Ver detalhes
                    </button>
                    <button
                      className="botao-perigo"
                      type="button"
                      onClick={() => excluirCorrecaoAluno(correcaoAlunoAtual)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="resumo-correcao resumo-correcao-compacto">
                  <div>
                    <strong>Acertos</strong>
                    <span>{correcaoAlunoAtual.acertos ?? 0}/{correcaoAlunoAtual.total_questoes ?? 0}</span>
                  </div>
                  <div>
                    <strong>Nota do dia</strong>
                    <span>{correcaoAlunoAtual.nota_dia ?? "-"}</span>
                  </div>
                  <div>
                    <strong>Nota global</strong>
                    <span>{correcaoAlunoAtual.nota_global ?? "-"}</span>
                  </div>
                  <div>
                    <strong>Gabarito</strong>
                    <span>{correcaoAlunoAtual.codigo_gabarito || "-"}</span>
                  </div>
                </div>

                {correcaoAlunoAtual.respostas_salvas?.length > 0 ? (
                  <div className="respostas-lidas respostas-lidas-compactas">
                    <h3>Respostas e gabarito</h3>
                    <div className="respostas-lidas-grid">
                      {correcaoAlunoAtual.respostas_salvas.map((resposta) => (
                        <span
                          key={resposta.numero_questao}
                          className={resposta.acertou ? "resposta-correta" : "resposta-incorreta"}
                        >
                          {resposta.numero_questao}: {resposta.resposta_aluno || "-"} / {resposta.resposta_correta || "-"}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="texto-vazio">Nota lancada manualmente, sem respostas salvas.</p>
                )}
              </div>
            )}

            <div className="modal-acoes">
              <button onClick={enviarFoto}>Enviar Foto do Gabarito</button>
              <button
                className="botao-secundario"
                type="button"
                disabled={!alunoSelecionado}
                onClick={() => {
                  if (alunoSelecionado) {
                    salvarProvaAdaptada(alunoSelecionado, dia);
                  }
                }}
              >
                Adaptada por disciplina
              </button>
            </div>

            <div className="correcao-manual">
              <div className="campo">
                <label>Respostas manuais</label>
                <textarea
                  value={respostasManuais}
                  onChange={(e) => setRespostasManuais(e.target.value.toUpperCase())}
                  placeholder="Ex.: A,D,C,B,B,C..."
                  rows={3}
                />
              </div>

              <button className="botao-secundario" type="button" onClick={corrigirManual}>
                Corrigir manualmente
              </button>
            </div>
          </section>

          {import.meta.env.VITE_MOSTRAR_PLANILHA_CORRECAO === "true" && alunos.length > 0 && (
            <section className="planilha">
              <div className="planilha-cabecalho">
                <h2>Planilha de notas por disciplina</h2>
                <span>{alunos.length} aluno(s)</span>
              </div>

              <div className="tabela-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Aluno</th>
                      {disciplinasPlanilha.map((disciplina) => (
                        <th key={disciplina}>{disciplina}</th>
                      ))}
                      <th>Nota dia 1</th>
                      <th>Nota dia 2</th>
                      <th>Nota global</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alunos.map((aluno) => {
                      const resultadoAluno = resultadosPorAluno[String(aluno.id)];
                      const acertos = resultadoAluno?.acertos ?? extrairAcertos(aluno);
                      const nota = resultadoAluno?.nota ?? extrairNota(aluno) ?? 0;
                      const temAcertos = acertos !== null && acertos !== undefined;
                      const diaDetalhePreferido = obterDiaDetalhePreferido(resultadoAluno);
                      const notaDia1 = obterResultadoDia(resultadoAluno, 1)?.nota;
                      const notaDia2 = obterResultadoDia(resultadoAluno, 2)?.nota;

                      return (
                        <tr
                          key={aluno.id}
                          className={temAcertos ? "linha-clicavel" : ""}
                          onClick={() => abrirDetalheAluno(aluno, diaDetalhePreferido)}
                        >
                          <td>{aluno.numero_chamada ?? "-"}</td>
                          <td>{aluno.nome}</td>

                          {disciplinasPlanilha.map((disciplina) => {
                            const resumo = resultadoAluno?.disciplinas?.[disciplina];
                            const notaDisciplina = formatarDisciplinaResultado(resumo, resultadoAluno);

                            return (
                              <td key={disciplina} className={classeNota(notaDisciplina)}>
                                {notaDisciplina}
                              </td>
                            );
                          })}

                          <td>
                            <div className="nota-editavel">
                              <span className={classeNota(notaDia1)}>
                                {notaDia1 !== null && notaDia1 !== undefined ? notaDia1 : 0}
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  editarNotaAluno(aluno, 1, notaDia1);
                                }}
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="nota-editavel">
                              <span className={classeNota(notaDia2)}>
                                {notaDia2 !== null && notaDia2 !== undefined ? notaDia2 : 0}
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  editarNotaAluno(aluno, 2, notaDia2);
                                }}
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                          <td className={classeNota(nota)}>{nota}</td>
                          <td>
                            <span className={temAcertos ? "status corrigido" : "status pendente"}>
                              {temAcertos ? "Corrigido" : "Pendente"}
                            </span>
                            <button
                              className="botao-adaptada"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                salvarProvaAdaptada(aluno, dia);
                              }}
                            >
                              Adaptada
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {resultado && (
            <div className="resultado">
              <h2>Resultado</h2>

              <p>
                <strong>Mensagem:</strong> {resultado.mensagem}
              </p>

              {Object.keys(disciplinasResultado).length > 0 && (
                <div className="resultado-disciplinas">
                  <h3>Notas por disciplina</h3>

                  <ul>
                    {Object.entries(disciplinasResultado).map(([disciplina, resumo]) => (
                      <li key={disciplina}>
                        <strong>{disciplina}:</strong>{" "}
                        <span className={classeNota(resumo.nota)}>{resumo.nota}</span>{" "}
                        ({resumo.acertos}/{resumo.total})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resultado.acertos !== undefined && (
                <p>
                  <strong>Total:</strong> {resultado.acertos}/{resultado.total_questoes}
                </p>
              )}

              {resultado.nota_global !== undefined && (
                <p>
                  <strong>Nota global:</strong>{" "}
                  <span className={classeNota(resultado.nota_global)}>{resultado.nota_global}</span>
                </p>
              )}

              {resultado.nota_dia !== undefined && (
                <p>
                  <strong>Nota do dia:</strong>{" "}
                  <span className={classeNota(resultado.nota_dia)}>{resultado.nota_dia}</span>
                </p>
              )}

              {resultado.modelo_prova_id && (
                <p>
                  <strong>Modelo da prova:</strong> {resultado.modelo_prova_id}
                </p>
              )}

              {resultado.codigo_gabarito && (
                <p>
                  <strong>Gabarito usado:</strong> {resultado.codigo_gabarito}
                </p>
              )}

              {resultado.respostas_salvas?.length > 0 && (
                <div className="respostas-lidas">
                  <h3>Respostas consideradas</h3>

                  <div className="respostas-lidas-grid">
                    {resultado.respostas_salvas.map((resposta) => (
                      <span
                        key={resposta.numero_questao}
                        className={resposta.acertou ? "resposta-correta" : "resposta-incorreta"}
                      >
                        {resposta.numero_questao}: {resposta.resposta_aluno || "-"} / {resposta.resposta_correta}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {paginaAtual === "resultado" && (
        <section className="secao pagina">
          <div className="planilha-cabecalho">
            <h2>Resultado final</h2>
            <button
              className="botao-download"
              type="button"
              onClick={baixarResultadoFinalExcel}
              disabled={!escolaId}
            >
              Baixar Excel da escola
            </button>
          </div>

          <div className="grade-controles">
            <div className="campo">
              <label>Turma</label>

              <select
                value={turmaId}
                onChange={(e) => {
                  setTurmaId(e.target.value);
                  setAlunoId("");
                  setAlunos([]);
                  setResultado(null);
                  setResultadosPorAluno({});
                  carregarAlunos(e.target.value);
                }}
              >
                <option value="">Selecione</option>

                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {renderizarTabelaResultadoFinal()}
        </section>
      )}

      {paginaAtual === "analise" && (
        <section className="secao pagina">
          <div className="planilha-cabecalho">
            <h2>Análise de dados</h2>
            <span>{bimestre}º bimestre</span>
          </div>

          {renderizarAnaliseDados()}
        </section>
      )}

      {detalheAluno && (
        <div className="modal-fundo" onClick={() => setDetalheAluno(null)}>
          <section className="modal-correcao" onClick={(event) => event.stopPropagation()}>
            <div className="modal-cabecalho">
              <div>
                <h2>{detalheAluno.aluno.nome}</h2>
                <span>
                  Nº {detalheAluno.aluno.numero_chamada ?? "-"} - Dia {detalheAluno.dia}
                </span>
              </div>

              <button className="botao-fechar" type="button" onClick={() => setDetalheAluno(null)}>
                Fechar
              </button>
            </div>

            <div className="modal-acoes">
              {[1, 2].map((diaOpcao) => {
                const resultadoDia = obterResultadoDia(
                  resultadosPorAluno[String(detalheAluno.aluno.id)],
                  diaOpcao
                );

                return (
                  <button
                    key={diaOpcao}
                    className={detalheAluno.dia === diaOpcao ? "botao-dia ativo" : "botao-dia"}
                    type="button"
                    disabled={!resultadoDia || carregandoDetalheAluno}
                    onClick={() => abrirDetalheAluno(detalheAluno.aluno, diaOpcao, true)}
                  >
                    Dia {diaOpcao}
                  </button>
                );
              })}
            </div>

            <div className="resumo-correcao">
              <div>
                <strong>Acertos</strong>
                <span>
                  {detalheAluno.dados.acertos ?? 0}/{detalheAluno.dados.total_questoes ?? 0}
                </span>
              </div>
              <div>
                <strong>Nota do dia</strong>
                <span className={classeNota(detalheAluno.dados.nota_dia)}>
                  {detalheAluno.dados.nota_dia ?? "-"}
                </span>
              </div>
              <div>
                <strong>Nota global</strong>
                <span className={classeNota(detalheAluno.dados.nota_global)}>
                  {detalheAluno.dados.nota_global ?? "-"}
                </span>
              </div>
              <div>
                <strong>Gabarito</strong>
                <span>{detalheAluno.dados.codigo_gabarito || "-"}</span>
              </div>
            </div>

            <div className="modal-acoes">
              <button
                type="button"
                onClick={() =>
                  editarNotaAluno(
                    detalheAluno.aluno,
                    detalheAluno.dia,
                    detalheAluno.dados.nota_dia
                  )
                }
              >
                Editar nota
              </button>
              <button
                type="button"
                onClick={() =>
                  editarAcertosAluno(
                    detalheAluno.aluno,
                    detalheAluno.dia,
                    detalheAluno.dados.acertos,
                    detalheAluno.dados.total_questoes
                  )
                }
              >
                Editar acertos
              </button>
              <button
                type="button"
                onClick={() =>
                  editarGabaritoAluno(
                    detalheAluno.aluno,
                    detalheAluno.dia,
                    detalheAluno.dados
                  )
                }
              >
                Editar respostas
              </button>
              <button
                type="button"
                onClick={() => salvarProvaAdaptada(detalheAluno.aluno, detalheAluno.dia)}
              >
                Adaptada por disciplina
              </button>
              <button className="botao-perigo" type="button" onClick={excluirCorrecaoAluno}>
                Excluir correção
              </button>
            </div>

            {detalheAluno.dados.respostas_salvas?.length > 0 ? (
              <div className="respostas-lidas">
                <h3>Respostas e gabarito</h3>

                <div className="respostas-lidas-grid">
                  {detalheAluno.dados.respostas_salvas.map((resposta) => (
                    <span
                      key={resposta.numero_questao}
                      className={resposta.acertou ? "resposta-correta" : "resposta-incorreta"}
                    >
                      {resposta.numero_questao}: {resposta.resposta_aluno || "-"} / {resposta.resposta_correta}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="texto-vazio">Nota lancada manualmente, sem respostas salvas.</p>
            )}
          </section>
        </div>
      )}

      <footer className="rodape-sistema">
        Desenvolvido por Sharlayne Jardini. Todos os direitos reservados.
      </footer>
    </div>
  );
}

export default App;
