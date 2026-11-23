# PulseBridge Frontend Agent Instruction

PulseBridge is a Next.js client being migrated from a real-estate platform (Nestar) to a healthcare platform: patients find clinics and doctors, book appointments and read health articles. The migration plan is in `MIGRATION_PLAN.md`.

## Stack

- Next.js 14 (Pages Router), React 18, TypeScript, MUI v5
- Soft Care design system: tokens and styles in `scss/pb`, shared UI in `libs/components/ui` and `libs/components/cards`; pages use `withPbLayout` and are responsive (no separate mobile pages)
- Apollo Client (`apollo/client.ts`), reactive vars in `apollo/store.ts`, JWT in `localStorage` (`libs/auth`)
- i18n: `next-i18next` (en / kr / uz) in `public/locales`
- Backend: NestJS GraphQL in `../pulsebridge` (branch `modification`)

## Rules

- Never change the backend API. The frontend follows the backend contract; resolvers and DTOs in `../pulsebridge/apps/pulsebridge-api/src` are the source of truth for operation names, argument names, fields and sort keys.
- Do not reintroduce property, agent or real-estate fields.
- `MemberType` is `PATIENT | DOCTOR | CLINIC | ADMIN`. Like/View/Comment groups are `DOCTOR | CLINIC | ARTICLE`.
- Keep the existing structure: GraphQL documents in `apollo/user` and `apollo/admin`, enums in `libs/enums`, types in `libs/types`, components in `libs/components`, pages in `pages`.
- Show UI actions by role and ownership (patient cancels; doctor or clinic owner completes or cancels).
- User-facing text goes through i18n keys.
- Keep changes small and match the surrounding code style (tabs, Prettier config).

## Validation

```bash
npx tsc --noEmit
npm run build
```
