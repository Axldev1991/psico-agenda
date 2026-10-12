# AGENTS.md — Development Guidelines for AI Agents

Welcome to **Psico-Agenda**, an offline-first clinical practice management web application for psychology professionals.

This document establishes the architecture, boundaries, coding standards, and verification procedures for automated agents (including Google Jules).

---

## 1. Tech Stack & Environment

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript 5 (strict mode enabled)
- **Styling:** Tailwind CSS v4 with custom clinical theme tokens
- **Persistence (Offline-First):** IndexedDB via Dexie.js (`src/infrastructure/db/`)
- **Cloud Sync:** Google Drive API with Last-Write-Wins (LWW) conflict resolution (`src/infrastructure/drive/`)
- **Test Runner:** Vitest (`vitest run`)
- **Package Manager:** `pnpm` (lockfile: `pnpm-lock.yaml`)

---

## 2. Architectural Boundaries (Clean Architecture)

Keep dependencies unidirectional:

```
src/
├── domain/         # Pure business logic, calculations, entities (ZERO UI or framework dependencies)
├── infrastructure/ # IndexedDB (Dexie), Google Drive sync, browser storage
├── ui/             # React components, hooks, views, modal orchestration
└── app/            # Next.js App Router root layout and pages
```

### Critical Constraints:
1. **Domain Isolation:** Modules in `src/domain/` MUST remain pure functions with zero React or DOM dependencies. They must be 100% unit tested.
2. **Persistence Safety:** NEVER modify IndexedDB schema migrations or encryption/sync mechanics in `src/infrastructure/drive/` unless the prompt explicitly requests it.
3. **No Unsolicited Dependencies:** Do NOT add new third-party packages to `package.json` without explicit human instruction.

---

## 3. UI & Accessibility Standard

- **16px Baseline Floor:** All body copy, table data cells, form labels, inputs, and buttons MUST respect a minimum accessible font size of 16px (`1rem` / `text-sm` or `text-base` in our Tailwind v4 configuration).
- **14px Compact Elements:** `text-xs` (14px) is strictly restricted to micro-badges and status tags. Never use `text-xs` for conversational text, data fields, or buttons.

---

## 4. Verification & Testing

Every proposed change MUST be validated before opening a Pull Request:

```bash
# 1. Run unit tests
npx vitest run

# 2. Verify TypeScript types
npx tsc --noEmit
```

- Existing tests MUST NEVER be deleted or relaxed to make a suite pass.
- New domain or utility logic must include companion `.test.ts` files.

---

## 5. Git & Commit Guidelines

- Use **Conventional Commits** (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`).
- Keep commit messages concise, descriptive, and technical.
- **NEVER** include `Co-Authored-By` or AI attribution trailers in commit messages.
- Pull Requests must include a clear explanation of changes, rationale, and confirmation of passing test results.
