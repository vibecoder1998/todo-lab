---
name: ui-change
description: Team playbook for any change to the dashboard UI, such as a new badge, field, button, filter or page. Use it whenever the task changes what the user sees.
---

# UI change playbook

1. Look at the design in `design/` first. Match the existing spacing, font sizes and card style.
2. Reuse what exists: theme tokens from `src/app/globals.css` and the components in `src/components/`. No new hex colors and no new dependencies.
3. Never use color alone. Every badge or status also shows a text label. Buttons are `<button>` elements with an accessible name.
4. Put any new logic in `src/lib/tasks.ts` as a pure function, with a Vitest test in `src/lib/tasks.test.ts`.
5. Run `pnpm test` and `pnpm build`. Both must pass.
6. Finish with a short report: the files you changed, how you verified each change, and anything you could not verify.
