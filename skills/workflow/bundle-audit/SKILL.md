---
name: bundle-audit
description: "Audit what one web app ships at one commit: build it the way the repo does, then measure total and initial size, the largest chunks, duplicate or similar packages, and what pulls each heavy module in, with evidence. Report only: changes no code, installs nothing outside a throwaway worktree. Use when a flow reaches its bundle audit, when another skill says to check bundle size, or when the user asks why an app is heavy or how to make it lighter."
summary: "Measures what a web app ships and why"
---

# Bundle audit

Users download what the build emits, not what the source looks like. This unit builds one app at one commit, measures what it ships, and traces each heavy piece to the import that brings it in. It changes nothing.

## Input

- **Repo** and the **commit** to audit.
- **Worktree**: a throwaway checkout of that commit, made by the caller (or by this unit, detached, and removed at the end). Never the user's own checkout.
- **Build command** from the flow config, if it names one; else the repo's own production build script.
- **Report path**: where the area report goes (e.g. `<run>/bundle.md`).
- **Load limits** from the flow config, if any. A production build is heavy: never two at once.

## Steps

1. **Read the repo's own setup**: the bundler (Rsbuild/Rspack, Vite, webpack, Next…), its chunking config, any size budget or size script already there (size-limit, a CI job, a stats script). A budget or script the repo has is run first, and reported on if it is broken.
2. **Install and build** in the worktree the way the repo does. With no app to build (a library, a backend), say the area doesn't apply and stop.
3. **Measure**, with the tool that fits the bundler. A tool the repo lacks may be fetched **inside the worktree only, and only when the caller allows it** (otherwise list it as not run) (`npx`, or a dev dependency or build plugin added there and never committed); never a global install. Write down every tool fetched and its version.
   - Rsbuild or Rspack: Rsdoctor (`RSDOCTOR=true` with `@rsdoctor/rspack-plugin`, then its analysis), following the official `rsdoctor-analysis` skill if it is installed.
   - Others: the bundler's stats file and an analyzer (`webpack-bundle-analyzer`, `rollup-plugin-visualizer`, `source-map-explorer`).
4. **Findings to look for**: total and initial (first-load) size, raw and gzip; the largest chunks and the largest modules inside them; packages bundled twice or at two versions; similar packages doing the same job; heavy modules in the initial chunk that could load later; barrel imports pulling in whole libraries; code marked with side effects that blocks tree shaking.
5. **Trace each heavy module** to the import that pulls it in (file and line), so the fix has a place to start.
6. **Write the report** (below), then remove the worktree if this unit made it.

## Report

- Header: repo, commit, build command, tools run with versions, tools fetched into the worktree, anything that didn't run and why.
- Baseline numbers: total and initial size (raw and gzip), chunk count, the five largest chunks, duplicate packages.
- Findings, each with an id (`B1`, `B2`…), the evidence (sizes, the chunk, the importing file and line), value (high, medium or low), effort (S, M or L), and the suggested action (lazy-load, replace, dedupe, fix the import, or a size budget that keeps it from coming back).

## Never

Commit, push, open an MR, comment, write to the tracker, change the build config outside the throwaway worktree, or install anything globally.
