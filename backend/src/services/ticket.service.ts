import { prisma } from "../utils/prisma";
import { ticketRepository } from "../repositories/ticket.repository";
import { AppError } from "../middlewares/errorHandler";
import { TokenPayload } from "../utils/jwt";
import { STATUSES, PRIORITIES, TicketStatus, Priority } from "../utils/constants";

interface CreateTicketInput {
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  location?: string;
  equipment?: string;
  contact?: string;
  departmentId?: string;
}

export const ticketService = {
  async list(user: TokenPayload, filters: { status?: string; priority?: string; categoryId?: string; technicianId?: string }) {
    const where: Record<string, unknown> = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.technicianId) where.technicianId = filters.technicianId;

    if (user.role === "USER") {
      where.requesterId = user.sub;
    } else if (user.role === "TECHNICIAN") {
      // técnico vê a fila (sem dono) + os que já são dele, a menos que um filtro específico seja pedido
      if (!filters.technicianId) {
        where.OR = [{ technicianId: null }, { technicianId: user.sub }];
      }
    }
    // ADMIN vê tudo, sem restrição adicional

    return ticketRepository.findMany(where);
  },

  async getById(user: TokenPayload, id: string) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    if (user.role === "USER" && ticket.requesterId !== user.sub) {
      throw new AppError("Você não tem acesso a este chamado.", 403);
    }

    return ticket;
  },

  async create(user: TokenPayload, input: CreateTicketInput) {
    if (!PRIORITIES.includes(input.priority)) {
      throw new AppError("Prioridade inválida.", 400);
    }

    const code = await ticketRepository.nextCode();

    const ticket = await ticketRepository.create({
      code,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "ABERTO",
      location: input.location,
      equipment: input.equipment,
      contact: input.contact,
      category: { connect: { id: input.categoryId } },
      department: input.departmentId ? { connect: { id: input.departmentId } } : undefined,
      requester: { connect: { id: user.sub } },
    });

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticket.id } },
      user: { connect: { id: user.sub } },
      action: "CREATED",
      toValue: "ABERTO",
      description: "Chamado aberto.",
    });

    return ticket;
  },

  async assign(user: TokenPayload, ticketId: string) {
    if (user.role !== "TECHNICIAN" && user.role !== "ANALISTA" && user.role !== "ADMIN") {
      throw new AppError("Apenas técnicos, analistas ou administradores podem assumir chamados.", 403);
    }

    // Captura atômica: só atualiza se ainda não houver técnico responsável
    const result = await prisma.ticket.updateMany({
      where: { id: ticketId, technicianId: null },
      data: { technicianId: user.sub, status: "EM_ATENDIMENTO" },
    });

    if (result.count === 0) {
      throw new AppError("Este chamado já foi assumido por outro técnico ou não existe.", 409);
    }

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: "ASSIGNED",
      toValue: user.sub,
      description: "Chamado assumido pelo técnico.",
    });

    return ticketRepository.findById(ticketId);
  },

  async forward(user: TokenPayload, ticketId: string, targetTechnicianId: string) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    const isAssignedTechnician = ticket.technicianId === user.sub;
    if (user.role !== "ADMIN" && !isAssignedTechnician) {
      throw new AppError("Apenas o técnico responsável ou o administrador podem encaminhar este chamado.", 403);
    }

    if (targetTechnicianId === ticket.technicianId) {
      throw new AppError("Este chamado já está com o técnico selecionado.", 400);
    }

    const targetTechnician = await prisma.user.findFirst({
      where: { id: targetTechnicianId, role: { name: "TECHNICIAN" } },
    });
    if (!targetTechnician) throw new AppError("Técnico de destino inválido.", 400);

    await ticketRepository.update(ticketId, { technicianId: targetTechnicianId, status: "EM_ATENDIMENTO" });

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: "FORWARDED",
      fromValue: ticket.technician?.name ?? "Não atribuído",
      toValue: targetTechnician.name,
      description: `Chamado encaminhado para o técnico ${targetTechnician.name}.`,
    });

    return ticketRepository.findById(ticketId);
  },

  async updateStatus(user: TokenPayload, ticketId: string, status: TicketStatus) {
    if (!STATUSES.includes(status)) {
      throw new AppError("Status inválido.", 400);
    }

    const current = await ticketRepository.findById(ticketId);
    if (!current) throw new AppError("Chamado não encontrado.", 404);

    const extra: Record<string, unknown> = { status };
    if (status === "RESOLVIDO") extra.resolvedAt = new Date();

    await ticketRepository.update(ticketId, extra);

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: "STATUS_CHANGE",
      fromValue: current.status,
      toValue: status,
      description: `Status alterado de ${current.status} para ${status}.`,
    });

    return ticketRepository.findById(ticketId);
  },

  async updatePriority(user: TokenPayload, ticketId: string, priority: Priority) {
    if (!PRIORITIES.includes(priority)) {
      throw new AppError("Prioridade inválida.", 400);
    }

    const current = await ticketRepository.findById(ticketId);
    if (!current) throw new AppError("Chamado não encontrado.", 404);

    await ticketRepository.update(ticketId, { priority });

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: "PRIORITY_CHANGE",
      fromValue: current.priority,
      toValue: priority,
      description: `Prioridade alterada de ${current.priority} para ${priority}.`,
    });

    return ticketRepository.findById(ticketId);
  },

  async addComment(user: TokenPayload, ticketId: string, content: string, isFirstTreatment: boolean) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    if (["RESOLVIDO", "CANCELADO"].includes(ticket.status)) {
      throw new AppError("Este chamado já foi finalizado. O bate-papo está encerrado.", 400);
    }

    const isRequester = ticket.requesterId === user.sub;
    const isAssignedTechnician = ticket.technicianId === user.sub;
    const isAdmin = user.role === "ADMIN";

    if (!isRequester && !isAssignedTechnician && !isAdmin) {
      throw new AppError("Você não tem permissão para enviar mensagens neste chamado.", 403);
    }

    const canMarkFirstTreatment = isAssignedTechnician || isAdmin;
    const firstTreatment = canMarkFirstTreatment && isFirstTreatment;

    await ticketRepository.addComment({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      content,
      isFirstTreatment: firstTreatment,
    });

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: firstTreatment ? "FIRST_TREATMENT" : "COMMENT",
      description: firstTreatment ? "Primeira tratativa registrada." : "Nova mensagem no chat do chamado.",
    });

    return ticketRepository.findById(ticketId);
  },

  async submitFeedback(user: TokenPayload, ticketId: string, rating: number, comment?: string) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new AppError("Chamado não encontrado.", 404);

    if (ticket.requesterId !== user.sub) {
      throw new AppError("Apenas o solicitante do chamado pode enviar o feedback.", 403);
    }

    if (ticket.status !== "RESOLVIDO") {
      throw new AppError("O feedback só pode ser enviado após o chamado ser resolvido.", 400);
    }

    if (ticket.feedback) {
      throw new AppError("Este chamado já recebeu uma avaliação.", 409);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError("A avaliação deve ser entre 1 e 5.", 400);
    }

    await ticketRepository.addFeedback({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      rating,
      comment,
    });

    await ticketRepository.addHistory({
      ticket: { connect: { id: ticketId } },
      user: { connect: { id: user.sub } },
      action: "FEEDBACK",
      toValue: String(rating),
      description: `Usuário avaliou o atendimento com nota ${rating}/5.`,
    });

    return ticketRepository.findById(ticketId);
  },
};
