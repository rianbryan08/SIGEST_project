import { prisma } from "../utils/prisma";

// Campos seguros de usuário para expor em respostas da API (nunca inclui passwordHash).
const safeUser = { select: { id: true, name: true, email: true } };

export const ticketRepository = {
  findMany(where: Record<string, unknown>) {
    return prisma.ticket.findMany({
      where,
      include: {
        category: true,
        requester: safeUser,
        technician: safeUser,
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  findById(id: string) {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        requester: safeUser,
        technician: safeUser,
        department: true,
        history: { orderBy: { createdAt: "asc" }, include: { user: safeUser } },
        comments: { orderBy: { createdAt: "asc" }, include: { user: safeUser } },
        attachments: true,
        feedback: { include: { user: safeUser } },
      },
    });
  },
  count(where: Record<string, unknown> = {}) {
    return prisma.ticket.count({ where });
  },
  groupByStatus() {
    return prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } });
  },
  groupByPriority() {
    return prisma.ticket.groupBy({ by: ["priority"], _count: { _all: true } });
  },
  groupByCategory() {
    return prisma.ticket.groupBy({ by: ["categoryId"], _count: { _all: true } });
  },
  async nextCode() {
    const count = await prisma.ticket.count();
    return `CH-${String(count + 1).padStart(4, "0")}`;
  },
  create(data: Parameters<typeof prisma.ticket.create>[0]["data"]) {
    return prisma.ticket.create({ data });
  },
  update(id: string, data: Parameters<typeof prisma.ticket.update>[0]["data"]) {
    return prisma.ticket.update({ where: { id }, data });
  },
  addHistory(data: Parameters<typeof prisma.ticketHistory.create>[0]["data"]) {
    return prisma.ticketHistory.create({ data });
  },
  addComment(data: Parameters<typeof prisma.ticketComment.create>[0]["data"]) {
    return prisma.ticketComment.create({ data });
  },
  addFeedback(data: Parameters<typeof prisma.ticketFeedback.create>[0]["data"]) {
    return prisma.ticketFeedback.create({ data });
  },
};
