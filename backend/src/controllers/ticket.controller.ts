import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ticketService } from "../services/ticket.service";

const createSchema = z.object({
  title: z.string().min(3, "Título é obrigatório."),
  description: z.string().min(5, "Descrição é obrigatória."),
  categoryId: z.string().min(1, "Categoria é obrigatória."),
  location: z.string().optional(),
  equipment: z.string().optional(),
  contact: z.string().optional(),
  departmentId: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_USUARIO", "RESOLVIDO", "CANCELADO"]),
});

const prioritySchema = z.object({
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
});

const commentSchema = z.object({
  content: z.string().min(1, "Comentário não pode ser vazio."),
  isFirstTreatment: z.boolean().optional().default(false),
});

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const forwardSchema = z.object({
  technicianId: z.string().min(1, "Selecione o técnico de destino."),
});

export const ticketController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, priority, categoryId, technicianId } = req.query;
      const tickets = await ticketService.list(req.user!, {
        status: status as string | undefined,
        priority: priority as string | undefined,
        categoryId: categoryId as string | undefined,
        technicianId: technicianId as string | undefined,
      });
      res.json(tickets);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.getById(req.user!, req.params.id);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      // Prioridade é classificada depois, apenas por técnico/admin (ver updatePriority).
      const ticket = await ticketService.create(req.user!, { ...data, priority: "MEDIA" });
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketService.assign(req.user!, req.params.id);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async forward(req: Request, res: Response, next: NextFunction) {
    try {
      const { technicianId } = forwardSchema.parse(req.body);
      const ticket = await ticketService.forward(req.user!, req.params.id, technicianId);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = statusSchema.parse(req.body);
      const ticket = await ticketService.updateStatus(req.user!, req.params.id, status);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async updatePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { priority } = prioritySchema.parse(req.body);
      const ticket = await ticketService.updatePriority(req.user!, req.params.id, priority);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, isFirstTreatment } = commentSchema.parse(req.body);
      const ticket = await ticketService.addComment(req.user!, req.params.id, content, isFirstTreatment);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, comment } = feedbackSchema.parse(req.body);
      const ticket = await ticketService.submitFeedback(req.user!, req.params.id, rating, comment);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },
};
