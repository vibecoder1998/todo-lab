# todo-lab decision log

Goal: replace the bug-triage lab project with a Next.js to-do web app built from the Figma "To-do List Web App Design" file, keeping the 7 A/B parts so attendees still see one difference per part.

Done means: the base app builds, tests pass and matches the Figma Dashboard frame in a screenshot, and every part's A and B differ on at least one scorecard check in a real reference run.

| # | Decision | Why | Evidence |
|---|---|---|---|
| 1 | Base app = the Figma Dashboard frame (16:35) only | It holds every concept the parts need: task list, statuses, priorities, stats, search, add task. The other 20 screens add scope, not lessons. | Figma page 16:34 lists 23 frames |
| 2 | Data shape: Task with Priority (Extreme, Moderate, Low) and Status (Not Started, In Progress, Completed) | These are the exact values in the Figma layers | Figma metadata layer names |
| 3 | Next.js 16.4.3, Tailwind 4.3.3, pnpm | Newest releases older than two weeks on 12 Nov 2026. pnpm shares one store across the 14 part folders. | `npm view next time` |
| 4 | Part 04 MCP uses the Figma connection instead of GitHub | Removes the GitHub token setup and uses the design the lab is built from | Checkpoint with the user, 12 Nov |
| 5 | Persistence in localStorage behind `src/lib/tasks.ts` | No backend to set up in a workshop. One module gives CLAUDE.md and the Skill a rule to point at. | |
| 6 | `agentRules: false` in `next.config.ts`, no AGENTS.md | Next.js 16 `next dev` writes an AGENTS.md when it detects an AI agent. That would give every "no memory" A folder project memory. | `next/dist/esm/server/lib/start-server.js:338`; a 25 s `next dev` run no longer creates the file |
| 7 | Donut percentages come from the real tasks, not the design's 84/46/13 | The design numbers are placeholders. Computed values make status changes visible. | `base-proof/check-2-status.png` |
| 8 | Skipped the invite avatars, notification and calendar buttons | Not needed by any lab part | `base-proof/side-by-side.png` |
| 9 | Layout fills the window (`h-dvh`), board capped at the design's 761 px | The fixed 1024 px Figma height made the whole page scroll on laptop windows. Task lists scroll inside their cards instead. | Page scroll measured at 1440x1024, 1512x860, 1440x760, 1280x720: none |
| 10 | Four width tiers: under 1024 px the page scrolls with stacked sections and a drawer menu; from 1024 px the window-filling board has two columns; from 1280 px a 250 px sidebar shows; from 1440 px (`desk:`) the Figma geometry is untouched | Every width was fixed to the 1440 px frame, so phones saw only the sidebar and 1024 to 1280 px windows clipped the right column. The board needs 889 px, which fits at 1024 px without a sidebar and at 1280 px with a 250 px one. | `responsive-proof/`: 11/32 cases pass on the old layout, 32/32 after. Pixel diff against the old build at 1440x900, 1440x1024 and 1920x1080: 0 pixels changed |
