import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../middlewares/errorHandler";
<<<<<<< HEAD
import { CREATABLE_ROLES, RESETTABLE_ROLES } from "../utils/constants";
=======
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2

const router = Router();
router.use(authMiddleware);

<<<<<<< HEAD
// ADMIN e ANALISTA podem listar usuários (para gerenciar quem está abaixo deles)
router.get("/", requireRole("ADMIN", "ANALISTA"), async (_req, res, next) => {
=======
router.get("/", requireRole("ADMIN"), async (_req, res, next) => {
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
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
<<<<<<< HEAD
  role: z.enum(["ADMIN", "ANALISTA", "TECHNICIAN", "USER"]),
  departmentId: z.string().optional(),
});

router.post("/", requireRole("ADMIN", "ANALISTA"), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    // Hierarquia: ADMIN pode criar qualquer cargo; ANALISTA só cria TECHNICIAN e USER.
    const allowedRoles = CREATABLE_ROLES[req.user!.role];
    if (!allowedRoles.includes(data.role)) {
      throw new AppError(`Seu perfil não pode criar usuários com o cargo ${data.role}.`, 403);
    }

=======
  role: z.enum(["ADMIN", "TECHNICIAN", "USER"]),
  departmentId: z.string().optional(),
});

router.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
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

<<<<<<< HEAD
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

// ADMIN redefine senha de ANALISTA/TECHNICIAN/USER; ANALISTA redefine senha de TECHNICIAN/USER.
// Ninguém redefine a própria senha por aqui, nem a de um cargo igual ou acima do seu.
router.put("/:id/password", requireRole("ADMIN", "ANALISTA"), async (req, res, next) => {
  try {
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const targetUser = await userRepository.findById(req.params.id);
    if (!targetUser) throw new AppError("Usuário não encontrado.", 404);

    const allowedRoles = RESETTABLE_ROLES[req.user!.role];
    if (!allowedRoles.includes(targetUser.role.name)) {
      throw new AppError("Seu perfil não pode redefinir a senha deste usuário.", 403);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(targetUser.id, passwordHash);

    res.json({ message: "Senha redefinida com sucesso." });
  } catch (err) {
    next(err);
  }
});

=======
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
export default router;
