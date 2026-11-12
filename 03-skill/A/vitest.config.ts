import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Claude Code creates subagent worktrees under .claude/worktrees; their copies of the tests must not run here.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
