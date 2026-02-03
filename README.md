# QuizRush

Self-hosted, real-time quiz platform inspired by Kahoot. Built with React, Vite, Tailwind, Framer Motion, Express, Socket.io, and SQLite.

## Quick Start (Dev)

1. Install dependencies:

```bash
npm install
```

2. Start the server (API + Socket.io):

```bash
npm run dev --workspace server
```

3. Start the client in another terminal:

```bash
npm run dev --workspace client
```

The client runs on `http://localhost:5173` and proxies API + sockets to `http://localhost:3001`.

## Environment Variables

- `JWT_SECRET` (default: `change-me`)
- `ADMIN_PASSWORD` (default: `change-me`)

## Production (Docker)

```bash
docker compose up --build -d
```

## API Summary

- `POST /api/auth/login` → `{ token }`
- `GET /api/quizzes`
- `POST /api/quizzes` (disabled)
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id` (disabled)
- `DELETE /api/quizzes/:id` (disabled)
- `POST /api/quizzes/:id/duplicate` (disabled)
- `GET /api/quizzes/:id/export`
- `POST /api/quizzes/import` (disabled)
- `GET /api/sessions/:code/export` → CSV export (host only)

## Socket Events

Client → Server: `host:create-session`, `player:join`, `host:start-game`, `host:next-question`, `player:answer`

Server → Client: `session:created`, `session:player-joined`, `game:question`, `game:answer-received`, `game:question-results`, `game:final-results`, `player:answer-feedback`
