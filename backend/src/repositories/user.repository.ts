import { prisma } from "../utils/prisma";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true, department: true },
    });
  },
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true, department: true },
    });
  },
  findAll() {
    return prisma.user.findMany({
      include: { role: true, department: true },
      orderBy: { name: "asc" },
    });
  },
  findTechnicians() {
    return prisma.user.findMany({
      where: { role: { name: "TECHNICIAN" } },
      include: { role: true },
      orderBy: { name: "asc" },
    });
  },
  create(data: { name: string; email: string; passwordHash: string; roleId: string; departmentId?: string }) {
    return prisma.user.create({ data, include: { role: true } });
  },
  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },
};
