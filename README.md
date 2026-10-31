# Sistema de Gerenciamento de Chamados de Suporte Técnico

> **Status atual:** Backend completo (auth, chamados, captura, histórico, tratativa, feedback, dashboard, hierarquia de cargos, categorias com prioridade/prazo, anexo de print, relatórios e base de conhecimento) rodando sobre **MySQL**. Frontend com login, dashboard, gestão de usuários e categorias, relatórios, base de conhecimento e as telas dedicadas por perfil.

## Tecnologias

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, **MySQL**, JWT, bcrypt
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide React

## Cargos e hierarquia

| Cargo       | Pode fazer |
|-------------|------------|
| **ADMIN**   | Vê e gerencia tudo. Cria usuários de qualquer cargo (Admin, Analista, Técnico, Solicitante) e redefine a senha de Analista, Técnico e Solicitante. |
| **ANALISTA**| Cria usuários dos cargos Técnico e Solicitante, e redefine a senha deles. Não cria nem redefine senha de Admin ou de outro Analista. Também abre chamados, captura/atende chamados e acessa o Dashboard — mesmas permissões de atendimento do Técnico. |
| **TECHNICIAN** (Técnico) | Só atua no atendimento: captura chamados da fila, registra tratativa, altera status/prioridade. Não cria usuários nem redefine senhas. |
| **USER** (Solicitante) | Abre e acompanha os próprios chamados, avalia o atendimento ao final. |

Essa regra é validada tanto no frontend (tela "Usuários" só mostra os cargos que o usuário logado pode criar/redefinir senha) quanto no backend:
- `POST /api/users` — criação, usando o mapa `CREATABLE_ROLES`
- `PUT /api/users/:id/password` — redefinição de senha ("esqueci minha senha"), usando o mapa `RESETTABLE_ROLES`

ambos em `backend/src/utils/constants.ts`.

## Telas do sistema

| Perfil    | Tela                     | Rota                    | O que faz |
|-----------|--------------------------|-------------------------|-----------|
| Admin, Analista, Técnico | Dashboard   | `/`                     | Estatísticas e gráficos gerais |
| Admin, Analista, Técnico, Usuário | Abertura de chamado | `/chamados/novo` | Abre um chamado: nome do solicitante, categoria (define prioridade e prazo), descrição e print opcional |
| Usuário   | Consulta de chamados     | `/consultar-chamados`   | Busca e acompanha seus chamados |
| Analista, Técnico | Painel do técnico | `/painel-tecnico`       | Fila disponível, captura e gestão dos seus atendimentos |
| Admin, Analista | Usuários           | `/usuarios`             | Lista usuários e cria novos, respeitando a hierarquia de cargos |
| Todos     | Detalhes do chamado      | `/chamados/:id`         | Timeline, tratativa (técnico) e **avaliação do usuário** ao final do atendimento |
| Admin     | Chamados (visão geral)   | `/chamados`              | Lista completa de todos os chamados |
| Admin     | Categorias               | `/categorias`            | Cadastra/edita categorias, com prioridade padrão e prazo de atendimento |
| Admin     | Relatórios               | `/relatorios`            | Chamados abertos por usuário e categoria, com filtro de período e exportação CSV |
| Admin, Analista, Técnico | Base de conhecimento | `/base-conhecimento` | Procedimentos por categoria, pesquisa por palavra-chave e aprovação |

## Categorias, prioridade e prazo

- As prioridades são **Baixa, Média e Alta** (a prioridade "Crítica" foi removida).
- Cada categoria tem uma **prioridade padrão** e um **prazo de atendimento** (em horas), configurados pelo Admin em `/categorias`.
- Ao abrir um chamado, a prioridade e o prazo da categoria escolhida são aplicados automaticamente. O prazo é gravado no chamado (`dueAt`), então editar a categoria depois só afeta os **próximos** chamados.
- O chamado não tem mais título: a **categoria** é a identificação principal, junto do código único (`CH-0001`).
- O formulário tem o campo **Nome do solicitante** (pode ser diferente de quem abriu) e permite **anexar um print** (PNG/JPG/WEBP/GIF, até 5 MB; também dá para colar com Ctrl+V). As imagens ficam em `backend/uploads` e só são entregues a quem tem acesso ao chamado.

## Base de conhecimento

- Procedimentos são vinculados a uma categoria e têm título, problema, solução e palavras-chave.
- **Nada vira solução automaticamente.** Quem atende escolhe registrar o procedimento (a partir do chamado ou na tela da base); trechos do bate-papo só entram se forem inseridos manualmente.
- Fluxo de aprovação: procedimento criado por **Técnico** fica *Aguardando aprovação*; **Admin/Analista** aprovam (ou criam já aprovado). Só procedimentos **aprovados** são sugeridos para reutilização.
- Dentro do chamado, o técnico vê os procedimentos aprovados da mesma categoria (priorizando os parecidos com a descrição), pode pesquisar por palavra-chave e marcar **"Usei este procedimento"**, o que fica no histórico e conta como reaproveitamento.



## Estrutura

```
projeto-chamados/
├── backend/
│   ├── src/
│   │   ├── controllers/    # auth, ticket
│   │   ├── services/       # auth, ticket (regras de negócio + feedback)
│   │   ├── repositories/   # user, ticket
│   │   ├── routes/         # auth, tickets, categories, users, dashboard
│   │   ├── middlewares/    # auth, role, errorHandler
│   │   ├── utils/          # jwt, prisma, constants
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma   # MySQL + enums nativos + TicketFeedback
│   │   └── seed.ts
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/       # Login, Dashboard, TicketQuery, TechnicianPanel, NewTicket, TicketDetail (com feedback), Tickets (admin), Users
        ├── components/  # Sidebar, Header (com toggle de tema), StatusBadge, PriorityBadge, StatCard
        ├── layouts/      # AppLayout (sidebar + header)
        ├── contexts/    # AuthContext, ThemeContext (modo claro/escuro)
        ├── routes/      # ProtectedRoute
        └── services/    # api.ts (axios)
```

## Pré-requisito: instalar o MySQL

Se você ainda não tem o MySQL na máquina, use uma destas opções:

- **XAMPP** (mais simples para quem nunca configurou banco): instale, abra o painel de controle e clique em "Start" no módulo MySQL.
- **MySQL Community Server** oficial: https://dev.mysql.com/downloads/mysql/
- **Docker**: `docker run --name chamados-mysql -e MYSQL_ROOT_PASSWORD=sua_senha -p 3306:3306 -d mysql:8`

Depois, crie o banco de dados (pode usar o MySQL Workbench, o phpMyAdmin do XAMPP, ou o terminal `mysql -u root -p`):

```sql
CREATE DATABASE chamados_db;
```

## Como executar

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env      # Windows (use "cp" no Mac/Linux)
```

Abra o arquivo `.env` e ajuste `DATABASE_URL` com seu usuário/senha reais do MySQL, por exemplo:
```
DATABASE_URL="mysql://root:minhasenha@localhost:3306/chamados_db"
```

Depois:
```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

> **Atualizando de uma versão anterior?** O banco mudou (categorias com prioridade/prazo, chamado sem título, anexos, base de conhecimento, prioridade sem "Crítica"). Este projeto não traz a pasta `prisma/migrations`: no `migrate dev`, se o Prisma avisar que precisa **resetar o banco** `chamados_db`, responda **y** (isso apaga os dados antigos e já roda o seed). Se aparecer erro de migration antiga/conflito, apague a pasta `backend/prisma/migrations` (se existir) e rode o comando de novo.

Backend sobe em `http://localhost:3333`.

### 2. Frontend (em outro terminal)

```bash
cd frontend
npm install
copy .env.example .env      # Windows (use "cp" no Mac/Linux)
npm run dev
```

Frontend sobe em `http://localhost:5173` — abra essa URL no navegador.

> **Importante:** MySQL, backend e frontend precisam estar rodando ao mesmo tempo.

## Usuários de demonstração (gerados pelo seed)

| Perfil    | Nome              | E-mail                       | Senha          |
|-----------|-------------------|-------------------------------|----------------|
| Admin     | Administrador do Sistema | admin@empresa.com      | Admin123!      |
| Analista  | Rian              | rian@empresa.com              | Analista123!   |
| Analista  | Vinicius          | vinicius@empresa.com          | Analista123!   |
| Técnico   | Carlos Silva      | carlos@empresa.com            | Tecnico123!    |
| Técnico   | Ana Souza         | ana@empresa.com               | Tecnico123!    |
| Usuário   | Fernanda Lima     | fernanda.lima@empresa.com     | Usuario123!    |
| Usuário   | Gabriel Rocha     | gabriel.rocha@empresa.com     | Usuario123!    |

O seed cria apenas os usuários, roles, departamentos e categorias (com SLA por categoria) — nenhum chamado fictício é criado, para você abrir chamados do zero durante a demonstração.

## Endpoints principais

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/tickets`, `POST /api/tickets`, `GET /api/tickets/:id`
- `POST /api/tickets` aceita `multipart/form-data` (campos `requesterName`, `categoryId`, `description`, opcionais `location`, `equipment`, `contact` e o arquivo `screenshot`); prioridade e prazo vêm da categoria
- `GET /api/tickets/:id/attachments/:attachmentId` (imagem anexada, com checagem de acesso)
- `POST /api/tickets/:id/assign` (captura)
- `PUT /api/tickets/:id/status`, `PUT /api/tickets/:id/priority`
- `POST /api/tickets/:id/comments` (tratativa)
- `POST /api/tickets/:id/feedback` (avaliação do usuário após resolução/encerramento)
- `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id` (Admin: nome, prioridade padrão, prazo em horas, ativa)
- `GET /api/reports/tickets-by-user-category?from=AAAA-MM-DD&to=AAAA-MM-DD` (Admin)
- `GET /api/knowledge` (`categoryId`, `q`, `status`), `GET /api/knowledge/suggestions/:ticketId`, `POST /api/knowledge`, `PUT /api/knowledge/:id`, `POST /api/knowledge/:id/approve`, `POST /api/knowledge/:id/revoke`, `POST /api/knowledge/:id/apply`, `DELETE /api/knowledge/:id`
- `GET /api/users`, `GET /api/users/technicians`, `POST /api/users`, `PUT /api/users/:id/password` (redefinir senha)
- `GET /api/dashboard/stats`, `GET /api/dashboard/charts`

## Próximos passos (planejados)

1. Tela de técnicos
2. Filtros avançados e paginação na listagem de chamados
3. Notificações e estados de loading/vazio mais refinados em todas as telas


