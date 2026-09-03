---
description: Verify lint, type-check, format and tests, then commit and push
---

## Steps

1. **Show the current state** so the user can see what is about to ship:
   - `git status` and `git diff --stat` to see what changed.

2. **Run the verification suite.** Run each check and stop on the first
   failure — do not push anything unless every check passes:
   - `npm run lint` — ESLint
   - `npm run type-check` — TypeScript, no emit
   - `npm run format:check` — Prettier
   - `npm run test` — vitest unit tests (run once, not watch mode)
   - `npm run build` — production build (includes the gates build step)

   If any check fails, fix the issue (or report it and stop). Do not commit
   or push with failing checks.

3. **Stage everything** once all checks pass:
   - `git add .`

4. **Commit** with a conventional commit message:
   - `git commit -m "<type>: <summary>"`
   - Type should match the change: `feat` / `fix` / `chore` / `docs` /
     `refactor` / `test`.
   - If the user provided a message, use it; otherwise write one from the
     staged changes.
   - The `pre-commit` hook (husky + lint-staged) runs staged-file linting and
     formatting automatically.

5. **Push** the current branch:
   - `git push`
   - The `pre-push` hook runs `vitest run` automatically.

## Notes

- Never commit or push when a check fails — surface the failure instead.
- If the working tree is already clean, say so and stop.
- Do not push to a remote unless the user asked; this command exists to ship
  changes, so pushing is the expected end state.
