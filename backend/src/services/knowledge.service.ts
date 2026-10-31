import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AppError } from "../middlewares/errorHandler";
import { TokenPayload } from "../utils/jwt";

type KnowledgeStatus = "PENDENTE" | "APROVADO";

const safeUser = { select: { id: true, name: true } };

const articleInclude = {
  category: { select: { id: true, name: true } },
  createdBy: safeUser,
  approvedBy: safeUser,
  _count: { select: { usages: true } },
} satisfies Prisma.KnowledgeArticleInclude;

// Admin e Analista aprovam e gerenciam todos os procedimentos; o Técnico propõe os seus.
const isApprover = (user: TokenPayload) => user.role === "ADMIN" || user.role === "ANALISTA";

const STOPWORDS = new Set([
  "para", "com", "que", "uma", "uns", "umas", "nos", "nas", "dos", "das", "por", "mais", "como", "esta", "este",
  "esse", "essa", "isso", "foi", "ser", "tem", "sem", "nao", "meu", "minha", "estou", "esta", "quando", "mas",
  "ainda", "pelo", "pela", "aos", "ele", "ela", "seu", "sua", "muito", "pra", "vez", "depois", "sempre", "ficou",
]);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Palavras relevantes de um texto (usado para sugerir procedimentos parecidos com o chamado).
function significantWords(text: string): string[] {
  const words = normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return [...new Set(words)];
}

interface ArticleInput {
  categoryId: string;
  title: string;
  problem: string;
  solution: string;
  keywords?: string;
  sourceTicketId?: string;
}

export const knowledgeService = {
  async list(user: TokenPayload, filters: { categoryId?: string; q?: string; status?: KnowledgeStatus }) {
    const conditions: Prisma.KnowledgeArticleWhereInput[] = [];

    if (filters.categoryId) conditions.push({ categoryId: filters.categoryId });
    if (filters.status) conditions.push({ status: filters.status });

    // Técnico enxerga os procedimentos aprovados e os que ele mesmo propôs.
    if (!isApprover(user)) {
      conditions.push({ OR: [{ status: "APROVADO" }, { createdById: user.sub }] });
    }

    // Busca por palavras-chave: todas as palavras digitadas precisam aparecer em algum campo.
    const tokens = (filters.q ?? "").split(/\s+/).filter((t) => t.length >= 2);
    for (const token of tokens) {
      conditions.push({
        OR: [
          { title: { contains: token } },
          { problem: { contains: token } },
          { solution: { contains: token } },
          { keywords: { contains: token } },
        ],
      });
    }

    return prisma.knowledgeArticle.findMany({
      where: { AND: conditions },
      include: articleInclude,
      orderBy: { updatedAt: "desc" },
    });
  },

  // Procedimentos aprovados da mesma categoria do chamado, ordenados por semelhança
  // com a descrição do chamado e, em seguida, por quantas vezes já foram reutilizados.
  async suggestionsForTicket(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { description: true, categoryId: true, knowledgeUses: { select: { articleId: true } } },
    });
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    const articles = await prisma.knowledgeArticle.findMany({
      where: { categoryId: ticket.categoryId, status: "APROVADO" },
      include: articleInclude,
    });

    const words = significantWords(ticket.description);
    const appliedIds = new Set(ticket.knowledgeUses.map((u) => u.articleId));

    return articles
      .map((article) => {
        const haystack = normalize(`${article.title} ${article.problem} ${article.solution} ${article.keywords ?? ""}`);
        const matches = words.filter((w) => haystack.includes(w)).length;
        return { ...article, matches, alreadyApplied: appliedIds.has(article.id) };
      })
      .sort((a, b) => b.matches - a.matches || b._count.usages - a._count.usages)
      .slice(0, 5);
  },

  async create(user: TokenPayload, input: ArticleInput) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AppError("Categoria inválida.", 400);

    if (input.sourceTicketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: input.sourceTicketId }, select: { id: true } });
      if (!ticket) throw new AppError("Chamado de origem não encontrado.", 400);
    }

    // Quem aprova publica direto; o Técnico envia para aprovação antes de virar referência.
    const approved = isApprover(user);

    return prisma.knowledgeArticle.create({
      data: {
        title: input.title,
        problem: input.problem,
        solution: input.solution,
        keywords: input.keywords || null,
        status: approved ? "APROVADO" : "PENDENTE",
        category: { connect: { id: input.categoryId } },
        createdBy: { connect: { id: user.sub } },
        approvedBy: approved ? { connect: { id: user.sub } } : undefined,
        approvedAt: approved ? new Date() : undefined,
        sourceTicket: input.sourceTicketId ? { connect: { id: input.sourceTicketId } } : undefined,
      },
      include: articleInclude,
    });
  },

  async update(user: TokenPayload, id: string, input: Partial<Omit<ArticleInput, "sourceTicketId">>) {
    const article = await this.getEditable(user, id);

    if (input.categoryId && input.categoryId !== article.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) throw new AppError("Categoria inválida.", 400);
    }

    return prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title: input.title,
        problem: input.problem,
        solution: input.solution,
        keywords: input.keywords === undefined ? undefined : input.keywords || null,
        categoryId: input.categoryId,
      },
      include: articleInclude,
    });
  },

  async approve(user: TokenPayload, id: string) {
    if (!isApprover(user)) throw new AppError("Apenas administradores e analistas podem aprovar procedimentos.", 403);

    const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new AppError("Procedimento não encontrado.", 404);

    return prisma.knowledgeArticle.update({
      where: { id },
      data: { status: "APROVADO", approvedBy: { connect: { id: user.sub } }, approvedAt: new Date() },
      include: articleInclude,
    });
  },

  // Tira o procedimento da lista de reutilização (volta para pendente).
  async revoke(user: TokenPayload, id: string) {
    if (!isApprover(user)) throw new AppError("Apenas administradores e analistas podem revogar a aprovação.", 403);

    const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new AppError("Procedimento não encontrado.", 404);

    return prisma.knowledgeArticle.update({
      where: { id },
      data: { status: "PENDENTE", approvedBy: { disconnect: true }, approvedAt: null },
      include: articleInclude,
    });
  },

  async remove(user: TokenPayload, id: string) {
    await this.getEditable(user, id);
    await prisma.knowledgeArticle.delete({ where: { id } });
  },

  // Registra que o procedimento foi usado para resolver este chamado.
  async apply(user: TokenPayload, articleId: string, ticketId: string) {
    const [article, ticket] = await Promise.all([
      prisma.knowledgeArticle.findUnique({ where: { id: articleId } }),
      prisma.ticket.findUnique({ where: { id: ticketId }, select: { id: true, technicianId: true } }),
    ]);
    if (!article) throw new AppError("Procedimento não encontrado.", 404);
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    if (article.status !== "APROVADO") {
      throw new AppError("Apenas procedimentos aprovados podem ser aplicados em chamados.", 400);
    }
    if (user.role !== "ADMIN" && ticket.technicianId !== user.sub) {
      throw new AppError("Apenas o responsável pelo atendimento pode registrar o procedimento aplicado.", 403);
    }

    const already = await prisma.ticketKnowledgeUse.findUnique({
      where: { ticketId_articleId: { ticketId, articleId } },
    });
    if (already) throw new AppError("Este procedimento já foi registrado neste chamado.", 409);

    await prisma.ticketKnowledgeUse.create({
      data: {
        ticket: { connect: { id: ticketId } },
        article: { connect: { id: articleId } },
        user: { connect: { id: user.sub } },
      },
    });

    await prisma.ticketHistory.create({
      data: {
        ticket: { connect: { id: ticketId } },
        user: { connect: { id: user.sub } },
        action: "KNOWLEDGE_APPLIED",
        toValue: article.title,
        description: `Procedimento da base de conhecimento aplicado: "${article.title}".`,
      },
    });
  },

  // Aprovadores editam/excluem qualquer procedimento; o autor só mexe nos seus enquanto pendentes.
  async getEditable(user: TokenPayload, id: string) {
    const article = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!article) throw new AppError("Procedimento não encontrado.", 404);

    const ownPending = article.createdById === user.sub && article.status === "PENDENTE";
    if (!isApprover(user) && !ownPending) {
      throw new AppError("Você não tem permissão para alterar este procedimento.", 403);
    }
    return article;
  },
};
