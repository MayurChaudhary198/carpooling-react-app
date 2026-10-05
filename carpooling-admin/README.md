# Carpooling Admin

Admin dashboard for the carpooling platform.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn-style UI components in `src/components/ui`
- React Router
- Axios API services
- lucide-react icons

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes For Agents

- Keep shared UI components in `src/components/ui`.
- Keep reusable API logic in `src/services`.
- Do not change passenger or driver behavior from this app unless the task explicitly asks for cross-app changes.
- Follow the backend API contract documented in `carpooling-passenger/FRONTEND_AI_AGENT_API_GUIDE.md` when touching shared admin endpoints.
