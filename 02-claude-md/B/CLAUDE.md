# To-do dashboard

Next.js 16 App Router, Tailwind CSS 4, pnpm. README.md explains where things live.

## Commands
- `pnpm dev`, `pnpm test`, `pnpm build`
- Run `pnpm test` and `pnpm build` before you say a change is done.

## Rules
- Every task read or write goes through `src/lib/tasks.ts`. Never call localStorage anywhere else.
- Store dates as ISO strings. Show them as dd/mm/yyyy (en-GB).
- Colors come from the theme tokens in `src/app/globals.css` (`brand`, `accent`, `muted`, `subtle`, `page`). No hex values in components.
- Any change to `src/lib/tasks.ts` gets a Vitest test in `src/lib/tasks.test.ts`.

## Team
- Design changes: post a before and after screenshot in #todo-design. Mai signs them off.
- Releases go out on Thursdays. Anything merged after Wednesday 17:00 waits a week.
