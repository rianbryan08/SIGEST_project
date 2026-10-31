import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Roles
  const [adminRole, analystRole, techRole, userRole] = await Promise.all([
    prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } }),
    prisma.role.upsert({ where: { name: "ANALISTA" }, update: {}, create: { name: "ANALISTA" } }),
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

  // Categorias com prioridade padrão e prazo de atendimento (em horas). Todo chamado novo
  // recebe automaticamente a prioridade e o prazo da categoria escolhida. Rede/acesso/sistema
  // são bloqueantes (prioridade alta, prazo curto); hardware/software podem exigir diagnóstico
  // ou instalação; impressora e outros têm impacto pontual.
  const categoriesData = [
    { name: "Rede", defaultPriority: "ALTA", slaHours: 4 },
    { name: "Acesso/Permissão", defaultPriority: "ALTA", slaHours: 4 },
    { name: "Sistema", defaultPriority: "ALTA", slaHours: 6 },
    { name: "Hardware", defaultPriority: "MEDIA", slaHours: 24 },
    { name: "Software", defaultPriority: "MEDIA", slaHours: 24 },
    { name: "Impressora", defaultPriority: "BAIXA", slaHours: 24 },
    { name: "Outros", defaultPriority: "BAIXA", slaHours: 48 },
  ] as const;
  const categories = await Promise.all(
    categoriesData.map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: { name: c.name, slaHours: c.slaHours, defaultPriority: c.defaultPriority },
      })
    )
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));

  const passwordHash = async (pwd: string) => bcrypt.hash(pwd, 10);

// Admin
const admin = await prisma.user.upsert({
  where: { email: "admin@empresa.com" },
  update: {},
  create: {
    name: "Administrador do Sistema",
    email: "admin@empresa.com",
    passwordHash: await passwordHash("Admin123!"),
    roleId: adminRole.id,
    departmentId: departments[0].id,
  },
});

// Analistas
const analystsData = [
  { name: "Rian", email: "rian@empresa.com" },
  { name: "Vinicius", email: "vinicius@empresa.com" },
];

for (const a of analystsData) {
  await prisma.user.upsert({
    where: { email: a.email },
    update: {},
    create: {
      name: a.name,
      email: a.email,
      passwordHash: await passwordHash("Analista123!"),
      roleId: analystRole.id,
      departmentId: departments[0].id,
    },
  });
}

// Técnicos
const techniciansData = [
  { name: "Carlos Silva", email: "carlos@empresa.com" },
  { name: "Ana Souza", email: "ana@empresa.com" },
];

for (const t of techniciansData) {
  await prisma.user.upsert({
    where: { email: t.email },
    update: {},
    create: {
      name: t.name,
      email: t.email,
      passwordHash: await passwordHash("Tecnico123!"),
      roleId: techRole.id,
      departmentId: departments[0].id,
    },
  });
}

// Clientes (usuarios solicitantes)
const clientsData = [
  { name: "Fernanda Lima", email: "fernanda.lima@empresa.com" },
  { name: "Gabriel Rocha", email: "gabriel.rocha@empresa.com" },
];

for (const c of clientsData) {
  await prisma.user.upsert({
    where: { email: c.email },
    update: {},
    create: {
      name: c.name,
      email: c.email,
      passwordHash: await passwordHash("Usuario123!"),
      roleId: userRole.id,
      departmentId: departments[Math.floor(Math.random() * departments.length)].id,
    },
  });
}

  // Base de conhecimento: procedimentos de exemplo já aprovados, para demonstração.
  const articles = [
    {
      category: "Impressora",
      title: "Impressora não imprime / fila travada",
      problem: "Documentos ficam parados na fila de impressão e a impressora não imprime nada.",
      solution:
        "1) Abrir Serviços e reiniciar o 'Spooler de impressão'.\n2) Apagar os arquivos de C:\\Windows\\System32\\spool\\PRINTERS.\n3) Reenviar a impressão e confirmar que a impressora está online.",
      keywords: "spooler, fila, impressão, travada",
    },
    {
      category: "Rede",
      title: "Sem acesso à internet em um computador (rede local ok)",
      problem: "Computador conectado ao cabo/Wi-Fi mas sem navegar; outros equipamentos funcionam normalmente.",
      solution:
        "1) Executar ipconfig /release e ipconfig /renew.\n2) Executar ipconfig /flushdns.\n3) Conferir se o IP está em DHCP automático e se o cabo/porta do switch está ativo.\n4) Persistindo, trocar o cabo e testar outra porta.",
      keywords: "internet, dns, dhcp, ipconfig, sem rede",
    },
    {
      category: "Acesso/Permissão",
      title: "Usuário bloqueado por tentativas de senha",
      problem: "Usuário informa que a conta foi bloqueada e não consegue entrar no Windows ou no sistema.",
      solution:
        "1) Confirmar a identidade do solicitante.\n2) No Active Directory, desbloquear a conta e redefinir a senha temporária.\n3) Orientar a trocar a senha no primeiro acesso.",
      keywords: "bloqueio, senha, active directory, conta",
    },
    {
      category: "Hardware",
      title: "Computador não liga",
      problem: "Ao apertar o botão de energia nada acontece ou o equipamento liga e desliga em seguida.",
      solution:
        "1) Testar outra tomada e outro cabo de força.\n2) Remover o cabo, segurar o botão de energia por 15 segundos e religar.\n3) Reencaixar memória RAM.\n4) Se persistir, encaminhar para manutenção (possível fonte ou placa-mãe).",
      keywords: "não liga, energia, fonte, memória",
    },
  ];
  for (const a of articles) {
  const existingArticle = await prisma.knowledgeArticle.findFirst({
    where: {
      title: a.title,
      categoryId: categoryByName.get(a.category)!,
    },
  });

  if (!existingArticle) {
    await prisma.knowledgeArticle.create({
      data: {
        title: a.title,
        problem: a.problem,
        solution: a.solution,
        keywords: a.keywords,
        status: "APROVADO",
        approvedAt: new Date(),
        category: { connect: { id: categoryByName.get(a.category)! } },
        createdBy: { connect: { id: admin.id } },
        approvedBy: { connect: { id: admin.id } },
      },
    });
  }
}

  console.log("Seed concluido com sucesso. Nenhum chamado foi criado (apenas 4 procedimentos de exemplo na base de conhecimento).");
  console.log("---");
  console.log("Login admin: admin@empresa.com / Admin123!");
  console.log("Login analista: rian@empresa.com / Analista123!");
  console.log("Login analista: vinicius@empresa.com / Analista123!");
  console.log("Login tecnico: carlos@empresa.com / Tecnico123!");
  console.log("Login tecnico: ana@empresa.com / Tecnico123!");
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
