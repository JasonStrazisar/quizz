# Repository Guidelines

## Project Structure & Module Organization
This repository is an npm workspace with two apps:
- `client/`: React + Vite frontend. Main code lives in `client/src` (`pages/`, `components/`, `hooks/`, `lib/`, `stores/`), with static assets in `client/public/`.
- `server/`: Express + Socket.io backend. Main code lives in `server/src` (`routes/`, `socket/`, `services/`, `db/`, `middleware/`), with SQLite data under `server/data/`.
- Root-level files (`package.json`, `docker-compose.yml`, `Dockerfile`) coordinate local and containerized runs.

## Build, Test, and Development Commands
Run commands from the repository root unless noted:
- `npm install`: install workspace dependencies.
- `npm run dev --workspace server`: start backend on port `3001`.
- `npm run dev --workspace client`: start frontend on port `5173`.
- `npm run build`: build client assets and run server build step.
- `npm run start --workspace server`: run backend in start mode.
- `docker compose up --build -d`: build and run full stack in containers.

## Coding Style & Naming Conventions
- Use ES modules and modern JavaScript (`type: module` in both workspaces).
- Follow existing style: 2-space indentation, semicolons, and double quotes.
- React components and page files use `PascalCase` (example: `HostSession.jsx`).
- Hooks use `camelCase` with `use` prefix (example: `useSocket.js`).
- Backend service and route files use descriptive `camelCase` names (example: `sessionService.js`).

## Testing Guidelines
There is currently no configured automated test framework in this repo. Until one is added:
- Perform manual smoke tests for core flows: login, quiz selection, host session creation, player join, answer submission, leaderboard/results.
- If you add tests, place them near source files or under workspace-level `tests/` and document the new command in this file.

## Commit & Pull Request Guidelines
Commit history is currently sparse, so use clear, imperative messages:
- Format: `scope: short action` (example: `server: validate answer payload`).
- Keep commits focused and atomic.

For pull requests:
- Describe behavior changes and affected paths (example: `client/src/pages/PlayerPlay.jsx`).
- Link related issues/tasks.
- Include screenshots or short recordings for UI changes.
- List manual verification steps and expected outcomes.

## Security & Configuration Tips
- Set `JWT_SECRET` and `ADMIN_PASSWORD` via environment variables in non-local environments.
- Do not commit real secrets or production database files.
