# Sistema de Gerenciamento de Chamados de Suporte Técnico

> **Status atual:** Backend completo (auth, tickets, captura, histórico, tratativa, feedback, dashboard, hierarquia de cargos) rodando sobre **MySQL**. Frontend com login, dashboard, modo escuro, gestão de usuários e as telas dedicadas por perfil.

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
| Usuário   | Abertura de chamado      | `/chamados/novo`        | Abre um novo chamado |
| Usuário   | Consulta de chamados     | `/consultar-chamados`   | Busca e acompanha seus chamados |
| Analista, Técnico | Painel do técnico | `/painel-tecnico`       | Fila disponível, captura e gestão dos seus atendimentos |
| Admin, Analista | Usuários           | `/usuarios`             | Lista usuários e cria novos, respeitando a hierarquia de cargos |
| Todos     | Detalhes do chamado      | `/chamados/:id`         | Timeline, tratativa (técnico) e **avaliação do usuário** ao final do atendimento |
| Admin     | Chamados (visão geral)   | `/chamados`              | Lista completa de todos os chamados |



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
- `POST /api/tickets/:id/assign` (captura)
- `PUT /api/tickets/:id/status`, `PUT /api/tickets/:id/priority`
- `POST /api/tickets/:id/comments` (tratativa)
- `POST /api/tickets/:id/feedback` (avaliação do usuário após resolução/encerramento)
- `GET /api/categories`, `POST /api/categories`
- `GET /api/users`, `GET /api/users/technicians`, `POST /api/users`, `PUT /api/users/:id/password` (redefinir senha)
- `GET /api/dashboard/stats`, `GET /api/dashboard/charts`

## Próximos passos (planejados)

1. Telas de CRUD de categorias e técnicos no frontend (hoje só listagem/criação de usuários em geral)
2. Página de relatórios
3. Filtros avançados e paginação na listagem de chamados
4. Notificações e estados de loading/vazio mais refinados em todas as telas


