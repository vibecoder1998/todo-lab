# todo-lab

A hands-on lab for working with Claude Code. Every part starts from the same Next.js to-do app, built from the [To-do List Web App Design](https://www.figma.com/design/ANFRy5rLw4kwNQEigIA4sm/To-do-List-Web-App-Design--Community-?node-id=16-35) Figma file. Each part has an **A** folder and a **B** folder that differ in one thing only. You run both and compare.

![The base app next to the Figma frame](base-proof/side-by-side.png)

## How to run a part

1. Open two terminals, or two Herdr panes.
2. In the first: `cd 03-skill/A && pnpm install && claude`
3. In the second: `cd 03-skill/B && pnpm install && claude`
4. Paste the prompt from each folder's `PROMPT.md`. It is the same text in both unless the part is about the prompt.
5. Tick the checks for A and B in `SCORECARD.md`.

Start a fresh Claude session for every folder, so nothing carries over.

## The parts

| Part | What changes between A and B | A | B |
|---|---|---|---|
| 01 Prompt | The prompt | "Build me a todo app." | A spec request: scope, states, acceptance criteria, no code yet |
| 02 CLAUDE.md | Project memory | No CLAUDE.md | CLAUDE.md with commands, rules and team facts |
| 03 Skill | A team playbook | No Skill | `ui-change` Skill in `.claude/skills/` |
| 04 MCP | Access to the design | Only the Figma link | The Figma MCP server in `.mcp.json` |
| 05 Artifact | How specific the ask is | "Add a stats page." | Named chart, counts, empty state and limits |
| 06 Parallel | One agent vs several | One agent builds three features | Three subagents in separate git worktrees, then a merge |
| 07 Proof | What counts as done | "Check it works" | Use it like a user in the browser, with a screenshot per step |

## Before you start

- Node 20 or newer, pnpm, and Claude Code.
- Part 04 B: the first time you start `claude`, run `/mcp`, pick **figma** and log in. A free Figma account is enough to read this community file.
- Part 06: each folder needs its own git repo for worktrees. Run `git init && git add -A && git commit -m start` inside `06-parallel/A` and `06-parallel/B` first.
- Part 07 B needs a browser tool. Start Claude with `claude --chrome`, or connect Playwright MCP.

## What's in the repo

| Path | What it is |
|---|---|
| `base/` | The starting app. Every part folder is a copy of it. |
| `01-prompt/` … `07-proof/` | The A and B folders for each part |
| `SCORECARD.md` | What to look for in each part |
| `tools/build-parts.py` | Rebuilds every part folder from `base/` |
| `base-proof/` | Screenshots that prove the base app matches the design and works |
| `responsive-proof/` | Phone and desktop layout tests for the base app, with a screenshot per case. Kept outside `base/` so the part folders don't inherit them |
| `DECISIONS.md` | Why the lab is built the way it is |

## Run the base app

```sh
cd base
pnpm install
pnpm dev        # http://localhost:3000
pnpm test
```

Tasks are saved in the browser's localStorage. To start over, run `localStorage.removeItem("todo-lab.tasks")` in the browser console and reload.

## Stack

Next.js 16.4.3 (App Router), React 19, Tailwind CSS 4.3.3, Vitest, pnpm. Versions are pinned.

## Credits

UI design from the Figma community file linked above. Photos and icons in `base/public/` come from that file.
