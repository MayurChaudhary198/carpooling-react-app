# Carpooling Driver

Driver-facing frontend for the carpooling platform.

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

- This app owns driver workflows such as car setup, document upload, trip creation, and driver booking management.
- Keep passenger-specific flows in `carpooling-passenger`.
- Keep admin-specific flows in `carpooling-admin`.
- Use `CARPOOLING_PASSENGER_BUILD_SPEC.md` only as historical handoff context; the passenger app now exists and should be inspected directly before editing.
