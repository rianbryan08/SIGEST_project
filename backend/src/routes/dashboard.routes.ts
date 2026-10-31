import { Router } from "express";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ticketRepository } from "../repositories/ticket.repository";

const router = Router();
router.use(authMiddleware);
router.use(requireRole("ADMIN", "ANALISTA", "TECHNICIAN"));

router.get("/stats", async (_req, res, next) => {
  try {
    const [total, abertos, emAtendimento, aguardandoUsuario, resolvidos, altaPrioridade] =
      await Promise.all([
        ticketRepository.count(),
        ticketRepository.count({ status: "ABERTO" }),
        ticketRepository.count({ status: "EM_ATENDIMENTO" }),
        ticketRepository.count({ status: "AGUARDANDO_USUARIO" }),
        ticketRepository.count({ status: "RESOLVIDO" }),
        ticketRepository.count({ priority: "ALTA" }),
      ]);

    res.json({
      total,
      abertos,
      emAtendimento,
      aguardandoUsuario,
      resolvidos,
      altaPrioridade,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/charts", async (_req, res, next) => {
  try {
    const [byStatus, byPriority, byCategoryRaw, categories] = await Promise.all([
      ticketRepository.groupByStatus(),
      ticketRepository.groupByPriority(),
      ticketRepository.groupByCategory(),
      prisma.category.findMany(),
    ]);

    const categoryMap = new Map(categories.map((c: { id: string; name: string }) => [c.id, c.name]));

    res.json({
      byStatus: byStatus.map((s: { status: string; _count: { _all: number } }) => ({
        status: s.status,
        total: s._count._all,
      })),
      byPriority: byPriority.map((p: { priority: string; _count: { _all: number } }) => ({
        priority: p.priority,
        total: p._count._all,
      })),
      byCategory: byCategoryRaw.map((c: { categoryId: string; _count: { _all: number } }) => ({
        category: categoryMap.get(c.categoryId) ?? "Desconhecida",
        total: c._count._all,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
