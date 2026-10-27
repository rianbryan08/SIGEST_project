import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório."),
  slaHours: z.number().int().positive().optional().default(24),
});

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { name, slaHours } = createSchema.parse(req.body);
    const category = await prisma.category.create({ data: { name, slaHours } });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

export default router;
