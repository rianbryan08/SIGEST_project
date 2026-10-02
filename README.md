# Sistema de Gerenciamento de Chamados de Suporte Técnico

> **Status atual:** Backend completo (auth, tickets, captura, histórico, tratativa, feedback, dashboard) rodando sobre **MySQL**. Frontend com login, dashboard, e 4 telas dedicadas: abertura de chamado, consulta de chamados (usuário), painel do técnico (captura + gestão) e avaliação do usuário ao final do atendimento (embutida na tela de detalhes do chamado).

## Tecnologias

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, **MySQL**, JWT, bcrypt
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide React

## Telas do sistema

| Perfil    | Tela                     | Rota                    | O que faz |
|-----------|--------------------------|-------------------------|-----------|
| Todos     | Dashboard                | `/`                     | Estatísticas e gráficos gerais |
| Usuário   | Abertura de chamado      | `/chamados/novo`        | Abre um novo chamado |
| Usuário   | Consulta de chamados     | `/consultar-chamados`   | Busca e acompanha seus chamados |
| Técnico   | Painel do técnico        | `/painel-tecnico`       | Fila disponível, captura e gestão dos seus atendimentos |
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
        ├── pages/       # Login, Dashboard, TicketQuery, TechnicianPanel, NewTicket, TicketDetail (com feedback), Tickets (admin)
        ├── components/  # Sidebar, Header, StatusBadge, PriorityBadge, StatCard
        ├── layouts/      # AppLayout (sidebar + header)
        ├── contexts/    # AuthContext
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

| Perfil    | E-mail               | Senha        |
|-----------|-----------------------|--------------|
| Admin     | admin@empresa.com     | Admin123!    |
| Técnico   | carlos@empresa.com    | Tecnico123!  |
| Técnico   | ana@empresa.com       | Tecnico123!  |
| Técnico   | joao@empresa.com      | Tecnico123!  |
| Usuário   | usuario@empresa.com   | Usuario123!  |
| Usuário   | cliente@empresa.com   | Usuario123!  |

15 chamados fictícios são criados automaticamente, distribuídos entre status, prioridades, categorias e técnicos.

## Endpoints principais

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/tickets`, `POST /api/tickets`, `GET /api/tickets/:id`
- `POST /api/tickets/:id/assign` (captura)
- `PUT /api/tickets/:id/status`, `PUT /api/tickets/:id/priority`
- `POST /api/tickets/:id/comments` (tratativa)
- `POST /api/tickets/:id/feedback` (avaliação do usuário após resolução/encerramento)
- `GET /api/categories`, `POST /api/categories`
- `GET /api/users`, `GET /api/users/technicians`, `POST /api/users`
- `GET /api/dashboard/stats`, `GET /api/dashboard/charts`

## Próximos passos (planejados)

1. Telas de CRUD de usuários, categorias e técnicos no frontend
2. Página de relatórios
3. Filtros avançados e paginação na listagem de chamados
4. Notificações e estados de loading/vazio mais refinados em todas as telas


