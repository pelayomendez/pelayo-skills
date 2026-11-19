---
name: deps-audit
description: "Audit one repo's dependencies at one commit: unused dependencies, exports and files, lighter replacements for heavy packages, duplicate versions, and outdated or vulnerable ones, each with evidence. Report only: changes no code, installs nothing outside a throwaway worktree. Use when a flow reaches its dependency audit, when another skill says to audit or trim dependencies, or when the user asks which packages a repo doesn't need or could replace."
summary: "Finds dependencies a repo can drop or swap"
---

# Dependency audit

A dependency costs install time, bundle size, attack surface and upgrade work, whether or not anything uses it. This unit lists what one repo could drop, swap or update, with the evidence for each, and changes nothing.

## Input

- **Repo** and the **commit** to audit.
- **Worktree**: a throwaway checkout of that commit, made by the caller (or by this unit, detached, and removed at the end). Never the user's own checkout.
- **Report path**: where the area report goes (e.g. `<run>/deps.md`).
- **Load limits** from the flow config, if any.

## Steps

1. **Read the repo's own setup** first: the package manager and lockfile, workspaces, and any existing dependency tooling (a Knip, depcheck or dependency-cruiser config, an `audit` or `outdated` script, CI jobs). A tool the repo already has, wired or broken, is the first thing to run and to report on.
2. **Install the repo's dependencies** in the worktree the way the repo does (`npm ci`, `pnpm install --frozen-lockfile`, `go mod download`). A tool the repo lacks may be fetched **inside the worktree only** (`npx <tool>`, or a dev dependency never committed); never a global install. Write down every tool fetched and its version.
3. **Unused**: dependencies, exports and files nothing imports. For JavaScript and TypeScript, Knip (`npx knip --reporter json`), with the repo's config if it has one. Check each hit before listing it: a package used only by a config file, a script, a CLI in `package.json` or a dynamic import is not unused.
4. **Lighter replacements**: match the dependencies against the e18e module-replacements list (native APIs, micro-utilities, preferred lighter packages). List only the ones the code uses, with where it uses them.
5. **Duplicates**: packages installed at more than one version (`npm ls <pkg> --all`, `pnpm why`), and which dependency pulls each copy.
6. **Outdated and vulnerable**: the package manager's own `outdated` and `audit`, majors and advisories only. Name the advisory and the path to it.
7. **Other ecosystems**: use the language's own commands (for Go, `go mod tidy -diff` and `govulncheck`, if the repo has them). If there is nothing to run, say the area doesn't apply rather than guessing.
8. **Write the report** (below), then remove the worktree if this unit made it.

## Report

- Header: repo, commit, tools run with versions, tools fetched into the worktree, anything that didn't run and why.
- Baseline numbers: dependencies (prod and dev), unused, duplicates, majors behind, advisories by severity.
- Findings, each with an id (`D1`, `D2`…), the evidence (command output, file and line), value and effort (S, M or L), and the suggested action (remove, replace, dedupe, upgrade, or a rule or check that keeps it from coming back).

## Never

Commit, push, open an MR, comment, write to the tracker, change a lockfile outside the throwaway worktree, or install anything globally.
