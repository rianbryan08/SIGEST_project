import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { knowledgeService } from "../services/knowledge.service";

const router = Router();
router.use(authMiddleware);
// A base de conhecimento é de uso interno da equipe de atendimento.
router.use(requireRole("ADMIN", "ANALISTA", "TECHNICIAN"));

const listQuerySchema = z.object({
  categoryId: z.string().optional(),
  q: z.string().optional(),
  status: z.enum(["PENDENTE", "APROVADO"]).optional(),
});

const articleSchema = z.object({
  categoryId: z.string().min(1, "Categoria é obrigatória."),
  title: z.string().trim().min(3, "Título é obrigatório.").max(150, "Título muito longo (máx. 150)."),
  problem: z.string().trim().min(5, "Descreva o problema."),
  solution: z.string().trim().min(5, "Descreva o procedimento/solução."),
  keywords: z.string().trim().max(190, "Palavras-chave muito longas (máx. 190).").optional(),
  sourceTicketId: z.string().optional(),
});

const updateSchema = articleSchema.omit({ sourceTicketId: true }).partial();

const applySchema = z.object({ ticketId: z.string().min(1) });

router.get("/", async (req, res, next) => {
  try {
    const filters = listQuerySchema.parse(req.query);
    res.json(await knowledgeService.list(req.user!, filters));
  } catch (err) {
    next(err);
  }
});

router.get("/suggestions/:ticketId", async (req, res, next) => {
  try {
    res.json(await knowledgeService.suggestionsForTicket(req.params.ticketId));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = articleSchema.parse(req.body);
    res.status(201).json(await knowledgeService.create(req.user!, data));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    res.json(await knowledgeService.update(req.user!, req.params.id, data));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/approve", async (req, res, next) => {
  try {
    res.json(await knowledgeService.approve(req.user!, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/revoke", async (req, res, next) => {
  try {
    res.json(await knowledgeService.revoke(req.user!, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/apply", async (req, res, next) => {
  try {
    const { ticketId } = applySchema.parse(req.body);
    await knowledgeService.apply(req.user!, req.params.id, ticketId);
    res.status(201).json({ message: "Procedimento registrado no chamado." });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await knowledgeService.remove(req.user!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
