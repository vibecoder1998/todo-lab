"""Rebuild every lab part folder from base/. Run from the repo root: python3 tools/build-parts.py"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "base"
DESIGN = ROOT / "base-proof" / "dashboard.png"
SKIP = shutil.ignore_patterns("node_modules", ".next", "*.tsbuildinfo", "next-env.d.ts")
FIGMA_VITALS = "https://www.figma.com/design/ANFRy5rLw4kwNQEigIA4sm/To-do-List-Web-App-Design--Community-?node-id=351-284"

CLAUDE_MD = """# To-do dashboard

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
"""

UI_SKILL = """---
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
"""

FIGMA_MCP = """{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
"""

PROMPTS = {
    "01-prompt": (
        "Build me a todo app.",
        "Act as a product engineer. Plan a to-do web app in Next.js from the design in design/dashboard.png. "
        "Cover tasks with a priority and a status, search, adding a task, and the task status chart. "
        "Include loading, empty and error states. Write testable acceptance criteria. "
        "Do not invent requirements the design doesn't show; list open questions instead. "
        "Write it to SPEC.md. Do not write code yet.",
    ),
    "02-claude-md": (
        "Run these two prompts one after the other.\n\n"
        "1. Who signs off a design change, where do I post it, and when is the next release? Name the file each answer comes from.\n\n"
        "2. Add an optional due date to tasks and show it on each task card.",
    ) * 2,
    "03-skill": ("Add a badge that marks Extreme-priority tasks as Vital.",) * 2,
    "04-mcp": (
        f"Build the Vital Task page at /vital from this Figma frame: {FIGMA_VITALS} . Reuse the existing sidebar and header.",
    ) * 2,
    "05-artifact": (
        "Add a stats page.",
        "Add a /stats page: a bar chart of tasks completed per day for the last 7 days, a count of tasks by priority, "
        "and an empty state when there are no tasks. Reuse the sidebar and header, read data only through "
        "src/lib/tasks.ts, and add no new dependencies.",
    ),
    "06-parallel": (
        "Add three features: delete a task from its ··· menu, a filter by priority, and a dark mode toggle. "
        "Run pnpm test and pnpm build at the end.",
        "Add three features in parallel: delete a task from its ··· menu, a filter by priority, and a dark mode toggle. "
        "Give each feature to its own subagent working in its own git worktree, then merge the three branches, "
        "fix any conflicts, and run pnpm test and pnpm build.",
    ),
    "07-proof": (
        "I finished the dashboard. Check it works and tell me if it is done.",
        "Before you say the dashboard is done: run pnpm dev, open http://localhost:3000 in the browser, and use it like a user. "
        "Search for a task by typing part of its title, click a task's circle to change its status, and add a task. "
        "Take a screenshot after each step. Report pass, fail or not verified for each feature, with the screenshot that proves it.",
    ),
}

PLANTED_BUG = (
    "return `${task.title}\\n${task.description}`.toLowerCase().includes(query.trim().toLowerCase());",
    "return `${task.title}\\n${task.description}`.toLowerCase().includes(query.trim());",
)


def part(name: str, variant: str) -> Path:
    folder = ROOT / name / variant
    if name == "01-prompt":
        folder.mkdir(parents=True)
    else:
        shutil.copytree(BASE, folder, ignore=SKIP)
    (folder / "design").mkdir(exist_ok=True)
    shutil.copy(DESIGN, folder / "design" / "dashboard.png")
    a, b = PROMPTS[name]
    (folder / "PROMPT.md").write_text((a if variant == "A" else b) + "\n")
    return folder


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def main() -> None:
    for name in PROMPTS:
        shutil.rmtree(ROOT / name, ignore_errors=True)
        for variant in "AB":
            folder = part(name, variant)
            if name == "02-claude-md" and variant == "B":
                write(folder / "CLAUDE.md", CLAUDE_MD)
            if name == "03-skill" and variant == "B":
                write(folder / ".claude/skills/ui-change/SKILL.md", UI_SKILL)
            if name == "04-mcp" and variant == "B":
                write(folder / ".mcp.json", FIGMA_MCP)
            if name == "07-proof":
                dash = folder / "src/components/Dashboard.tsx"
                code = dash.read_text()
                assert PLANTED_BUG[0] in code, "search line changed in base; update PLANTED_BUG"
                dash.write_text(code.replace(*PLANTED_BUG))
    print("built:", ", ".join(f"{n}/A,B" for n in PROMPTS))


if __name__ == "__main__":
    main()
