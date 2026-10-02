import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/errorHandler";

const router = Router();
router.use(authMiddleware);

router.get("/", requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const users = await userRepository.findAll();
    res.json(users.map((u: { passwordHash: string; [key: string]: unknown }) => {
      const { passwordHash, ...rest } = u;
      return rest;
    }));
  } catch (err) {
    next(err);
  }
});

router.get("/technicians", async (_req, res, next) => {
  try {
    const technicians = await userRepository.findTechnicians();
    res.json(technicians.map((u: { passwordHash: string; [key: string]: unknown }) => {
      const { passwordHash, ...rest } = u;
      return rest;
    }));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  role: z.enum(["ADMIN", "TECHNICIAN", "USER"]),
  departmentId: z.string().optional(),
});

router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError("Já existe um usuário com este e-mail.", 409);

    const role = await prisma.role.findUnique({ where: { name: data.role } });
    if (!role) throw new AppError("Perfil inválido.", 400);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: role.id,
      departmentId: data.departmentId,
    });

    const { passwordHash: _omit, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
