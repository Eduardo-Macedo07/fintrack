/**
 * Conteúdo EDUCATIVO sobre onde o dinheiro costuma ficar, por objetivo.
 *
 * Regras deste arquivo:
 *  - Descreve TIPOS de investimento, nunca recomenda um produto ou instituição.
 *  - Não promete rentabilidade: taxas mudam e cada produto tem suas condições.
 *  - Não detalha regras de imposto (mudam com frequência): manda conferir.
 */
export type LearnStep = {
  id: string;
  title: string;
  when: string;
  where: string;
  risk: "Baixo" | "Baixo a médio" | "Médio a alto";
  access: string;
  note?: string;
};

export const DEBT_FIRST = {
  title: "Antes de investir: dívidas caras",
  text: "Juros de cartão de crédito (rotativo) e cheque especial costumam custar bem mais do que qualquer investimento rende. Se você tem esse tipo de dívida, quitá-la é o melhor 'investimento' do momento.",
};

export const LEARN_STEPS: LearnStep[] = [
  {
    id: "reserve",
    title: "1. Reserva de emergência",
    when: "Para imprevistos: perder a renda, um conserto, uma despesa médica. A regra comum é guardar de 3 a 6 meses do seu custo de vida.",
    where:
      "Opções simples, com baixo risco e que podem ser resgatadas rápido, como Tesouro Selic ou CDB com liquidez diária.",
    risk: "Baixo",
    access: "Resgate no mesmo dia ou no dia seguinte",
    note: "Aqui o objetivo é segurança e acesso rápido, não render o máximo.",
  },
  {
    id: "goals",
    title: "2. Objetivos de médio prazo (1 a 5 anos)",
    when: "Viagem, troca de carro, entrada de um imóvel: coisas com data para acontecer.",
    where:
      "Renda fixa com vencimento perto da data do objetivo, como CDBs, LCIs e LCAs ou títulos do Tesouro (prefixados ou ligados à inflação).",
    risk: "Baixo a médio",
    access: "No vencimento (vender antes pode custar rendimento)",
    note: "Combine o prazo do investimento com o prazo do objetivo.",
  },
  {
    id: "long",
    title: "3. Longo prazo (5 anos ou mais)",
    when: "Aposentadoria e patrimônio. Dá tempo de atravessar altas e quedas.",
    where:
      "Diversificar entre renda fixa e renda variável (ações, fundos, ETFs). Quanto mais diversificado, menos um único erro pesa.",
    risk: "Médio a alto",
    access: "Varia; o valor oscila bastante no curto prazo",
    note: "Só entre aqui com a reserva de emergência pronta e dinheiro que você não vai precisar tão cedo.",
  },
];

export const DISCLAIMER =
  "Conteúdo educativo, não é recomendação de investimento. Rentabilidade passada não garante resultado futuro, taxas e impostos mudam, e cada produto tem regras próprias. Para decidir, compare as condições atuais e, se precisar, fale com um profissional certificado.";

/** Referência datada, só para contextualizar as hipóteses. Atualize quando mudar. */
export const REFERENCE = {
  selicPct: 13.75,
  asOf: "04/11/2026",
  inflationPct: 5,
  source: "https://www.bcb.gov.br/controleinflacao/taxaselic",
};
