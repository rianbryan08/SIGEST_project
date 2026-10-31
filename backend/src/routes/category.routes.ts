import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { AppError } from "../middlewares/errorHandler";

const router = Router();
router.use(authMiddleware);

const prioritySchema = z.enum(["BAIXA", "MEDIA", "ALTA"]);

const createSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório."),
  slaHours: z.number().int().min(1, "O prazo deve ser de pelo menos 1 hora.").max(720, "O prazo máximo é de 720 horas (30 dias)."),
  defaultPriority: prioritySchema,
  active: z.boolean().optional().default(true),
});

const updateSchema = createSchema.partial();

// Administrador vê todas (inclusive inativas) para gerenciar; os demais só veem as ativas.
router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: req.user!.role === "ADMIN" ? {} : { active: true },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) throw new AppError("Já existe uma categoria com este nome.", 409);

    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// Mudanças valem para os NOVOS chamados: o prazo de cada chamado é gravado na abertura.
router.put("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);

    const current = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!current) throw new AppError("Categoria não encontrada.", 404);

    if (data.name && data.name !== current.name) {
      const duplicated = await prisma.category.findUnique({ where: { name: data.name } });
      if (duplicated) throw new AppError("Já existe uma categoria com este nome.", 409);
    }

    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

export default router;
