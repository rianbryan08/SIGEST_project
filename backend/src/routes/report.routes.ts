import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN"));

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.");

const querySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});

// Quantos chamados cada usuário abriu, agrupados por categoria (dados reais do banco).
// Período opcional: filtra pela data de abertura do chamado.
router.get("/tickets-by-user-category", async (req, res, next) => {
  try {
    const { from, to } = querySchema.parse(req.query);

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (from) createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) createdAt.lte = new Date(`${to}T23:59:59.999`);
    const where = from || to ? { createdAt } : {};

    const [grouped, users, categories] = await Promise.all([
      prisma.ticket.groupBy({ by: ["requesterId", "categoryId"], where, _count: { _all: true } }),
      prisma.user.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

    const userName = new Map(users.map((u) => [u.id, u.name]));
    const categoryName = new Map(categories.map((c) => [c.id, c.name]));

    const rows = grouped
      .map((g) => ({
        userId: g.requesterId,
        userName: userName.get(g.requesterId) ?? "Usuário removido",
        categoryId: g.categoryId,
        categoryName: categoryName.get(g.categoryId) ?? "Categoria removida",
        total: g._count._all,
      }))
      .sort((a, b) => a.userName.localeCompare(b.userName, "pt-BR") || b.total - a.total);

    res.json({
      from: from ?? null,
      to: to ?? null,
      totalTickets: rows.reduce((sum, r) => sum + r.total, 0),
      rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
