# To-do dashboard

The Dashboard screen from the To-do List Web App Figma design, built with Next.js.

## Run

```sh
pnpm install
pnpm dev     # http://localhost:3000
pnpm test    # Vitest
pnpm build
```

## Where things are

- `src/lib/tasks.ts` holds the task types and every read and write of the saved tasks.
- `data/tasks.json` is the sample data used on first load.
- `src/components/` holds the screen: `Dashboard`, `Sidebar`, `TaskCard`, `StatusDonut`, `AddTask`.
- `public/` holds the icons and photos exported from Figma.

Tasks are saved in the browser's localStorage. To reset, run `localStorage.removeItem("todo-lab.tasks")` in the browser console.
