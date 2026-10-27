import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Limpa dados existentes de chamados/historico/comentarios/feedback e usuarios,
  // preservando apenas roles, departamentos e categorias (estrutura fixa do sistema).
  await prisma.ticketFeedback.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Roles
<<<<<<< HEAD
  const [adminRole, analystRole, techRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } }),
    prisma.role.upsert({ where: { name: "ANALISTA" }, update: {}, create: { name: "ANALISTA" } }),
=======
  const [adminRole, techRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } }),
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
    prisma.role.upsert({ where: { name: "TECHNICIAN" }, update: {}, create: { name: "TECHNICIAN" } }),
    prisma.role.upsert({ where: { name: "USER" }, update: {}, create: { name: "USER" } }),
  ]);

  // Departments
  const deptNames = ["TI", "Financeiro", "RH", "Comercial", "Operações"];
  const departments = await Promise.all(
    deptNames.map((name) =>
      prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // Categorias com SLA de resolução (em horas), baseado em práticas comuns de
  // mercado para suporte de TI: rede/acesso são bloqueantes e têm prazo curto,
  // hardware/software podem exigir peça ou instalação e têm prazo maior.
  const categoriesData = [
    { name: "Rede", slaHours: 4 }, // conectividade afeta todo mundo, prioridade máxima
    { name: "Acesso/Permissão", slaHours: 4 }, // usuário travado sem conseguir trabalhar
    { name: "Sistema", slaHours: 6 }, // sistema de negócio (ex: ERP) fora do ar
    { name: "Impressora", slaHours: 24 }, // impacto pontual, 1 dia útil
    { name: "Hardware", slaHours: 24 }, // pode depender de diagnóstico/peça física
    { name: "Software", slaHours: 24 }, // instalação/configuração, 1 dia útil
    { name: "Outros", slaHours: 48 }, // sem categoria específica, prazo padrão maior
  ];
  await Promise.all(
    categoriesData.map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: { slaHours: c.slaHours },
        create: { name: c.name, slaHours: c.slaHours },
      })
    )
  );

  const passwordHash = async (pwd: string) => bcrypt.hash(pwd, 10);

  // Admin
  await prisma.user.create({
    data: {
      name: "Administrador do Sistema",
      email: "admin@empresa.com",
      passwordHash: await passwordHash("Admin123!"),
      roleId: adminRole.id,
      departmentId: departments[0].id,
    },
  });

<<<<<<< HEAD
  // Analistas
  const analystsData = [
    { name: "Rian", email: "rian@empresa.com" },
    { name: "Vinicius", email: "vinicius@empresa.com" },
  ];
  for (const a of analystsData) {
    await prisma.user.create({
      data: {
        name: a.name,
        email: a.email,
        passwordHash: await passwordHash("Analista123!"),
        roleId: analystRole.id,
        departmentId: departments[0].id,
      },
    });
  }

  // Tecnicos
  const techniciansData = [
    { name: "Carlos Silva", email: "carlos@empresa.com" },
    { name: "Ana Souza", email: "ana@empresa.com" },
=======
  // Tecnicos
  const techniciansData = [
    { name: "Rian", email: "rian@empresa.com" },
    { name: "Vinicius", email: "vinicius@empresa.com" },
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
  ];
  for (const t of techniciansData) {
    await prisma.user.create({
      data: {
        name: t.name,
        email: t.email,
        passwordHash: await passwordHash("Tecnico123!"),
        roleId: techRole.id,
        departmentId: departments[0].id,
      },
    });
  }

  // Clientes (usuarios solicitantes) com nomes aleatorios
  const clientsData = [
    { name: "Fernanda Lima", email: "fernanda.lima@empresa.com" },
    { name: "Gabriel Rocha", email: "gabriel.rocha@empresa.com" },
  ];
  for (const c of clientsData) {
    await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        passwordHash: await passwordHash("Usuario123!"),
        roleId: userRole.id,
        departmentId: departments[Math.floor(Math.random() * departments.length)].id,
      },
    });
  }

  console.log("Seed concluido com sucesso. Nenhum chamado foi criado.");
  console.log("---");
  console.log("Login admin: admin@empresa.com / Admin123!");
<<<<<<< HEAD
  console.log("Login analista: rian@empresa.com / Analista123!");
  console.log("Login analista: vinicius@empresa.com / Analista123!");
  console.log("Login tecnico: carlos@empresa.com / Tecnico123!");
  console.log("Login tecnico: ana@empresa.com / Tecnico123!");
=======
  console.log("Login tecnico: rian@empresa.com / Tecnico123!");
  console.log("Login tecnico: vinicius@empresa.com / Tecnico123!");
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
  console.log("Login cliente: fernanda.lima@empresa.com / Usuario123!");
  console.log("Login cliente: gabriel.rocha@empresa.com / Usuario123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
