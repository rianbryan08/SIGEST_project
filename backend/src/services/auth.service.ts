import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository";
import { signToken } from "../utils/jwt";
import { AppError } from "../middlewares/errorHandler";

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    const token = signToken({ sub: user.id, role: user.role.name });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        department: user.department?.name ?? null,
      },
    };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      department: user.department?.name ?? null,
    };
  },
};
