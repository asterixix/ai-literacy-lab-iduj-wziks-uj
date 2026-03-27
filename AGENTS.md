<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Literacy Lab — Agent Instructions

These instructions are mandatory for all coding agents working in this repository.

## 1) Project Purpose

- Build and maintain a public educational platform for AI Literacy Lab.
- Keep the app simple, content-first, and easy to edit by non-developers.
- Prefer robust, boring solutions over clever abstractions.

## 2) Core Stack and Non-Negotiables

- Next.js 15 with App Router only (`src/app`).
- TypeScript strict mode; avoid `any`.
- Tailwind CSS v4 with design tokens in `src/app/globals.css`.
- shadcn/ui components and style conventions.
- MDX content in `src/content/**`.
- `pnpm` for scripts and dependencies.

## 3) Architecture Rules

- Keep route logic in `src/app/**`; shared logic in `src/lib/**`; reusable UI in `src/components/**`.
- Use Server Components by default.
- Add `"use client"` only for interactive behavior (theme toggle, motion, viewport hooks, etc.).
- Keep files focused; extract small components/helpers when a file grows complex.

## 4) Content and MDX Rules

- All educational text should live in MDX where possible.
- Module definitions must stay consistent between:
  - `src/lib/modules.ts` (typed metadata),
  - `src/content/modules/*.mdx` (rich content).
- MDX supports GFM tables through `remark-gfm`; preserve this pipeline in `src/lib/mdx.ts`.
- When updating content format, ensure both `/program/[slug]` and `/materialy` render correctly.

## 5) Design and UI Guidelines

- Visual style: minimal, monochrome, typographic.
- Respect current token palette and contrast in light/dark themes.
- Do not introduce random colors, heavy gradients, or decorative effects that break style consistency.
- Use semantic HTML and accessible interactions:
  - meaningful `alt`,
  - proper heading hierarchy,
  - keyboard-friendly buttons/links.

## 6) Links and External URLs

- Keep external URLs in constants or env-backed constants where already established.
- Use `target="_blank"` + `rel="noopener noreferrer"` for external links.
- Internal navigation must use `next/link`.

## 7) Images and SVGs

- Use `next/image` for rendered images/SVG assets unless a strong reason exists not to.
- For logo grids and responsive containers:
  - prefer predictable wrappers (`relative`, explicit size/aspect),
  - avoid clipping unless explicitly desired.
- If an SVG appears too small due to internal whitespace, fix display strategy first; only edit raw SVG if needed.

## 8) Reliability and Error Handling

- Unknown dynamic program slugs must resolve safely (404 / `notFound()` behavior).
- Avoid runtime-only assumptions that can cause hydration mismatch.
- For theme-based UI, ensure SSR/CSR consistency (mount-aware client logic when needed).

## 9) Coding Standards

- Use clear naming, small functions, and explicit types.
- Avoid dead imports, stale constants, and unused branches.
- Keep comments short and purposeful; explain "why", not obvious "what".

## 10) Verification Before Finishing

Before declaring a task done:

1. Run lint:
   - `pnpm lint`
2. For substantial changes, also run build:
   - `pnpm build`
3. If change affects UI layout, validate visually in browser/dev server.
4. Report exactly what changed and where.

## 11) Safe Change Policy

- Never perform destructive git/file operations unless explicitly requested.
- Do not revert user-authored changes outside the task scope.
- Keep edits minimal and scoped to the user request.
