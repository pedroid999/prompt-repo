# Story 1.1: Project Initialization & Foundation

Status: done

## Story

As a developer,
I want to initialize the project with Next.js 15, Shadcn UI, and Supabase SSR,
so that I have a performant and secure foundation for building features.

## Acceptance Criteria

1. **Given** the project directory is initialized
   **When** I run the initialization commands (Next.js 15, Shadcn UI with Zinc theme, Supabase SSR)
   **Then** a functional Next.js 15 app is created with the `/src` directory structure
2. **And** the Kanagawa theme colors are applied to the Tailwind configuration
3. **And** Geist Mono is set as the default typeface for all content (Monospace for prompt content, Sans for UI)

## Tasks / Subtasks

- [x] Initialize Next.js 15 App (AC: #1)
  - [x] Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [x] Initialize Shadcn UI (AC: #1)
  - [x] Run `npx shadcn-ui@latest init -d -c zinc`
- [x] Install Supabase Dependencies (AC: #1)
  - [x] Run `npm install @supabase/ssr @supabase/supabase-js`
- [x] Configure Kanagawa Theme (AC: #2)
  - [x] Update `tailwind.config.ts` with Kanagawa color palette (Dragon, Fuji, Crystal Blue, Spring Green, Suminkashi)
- [x] Setup Typography (AC: #3)
  - [x] Configure `Geist Sans` and `Geist Mono` in `src/app/layout.tsx`
  - [x] Update `tailwind.config.ts` to include `font-mono` as default for content areas

## Dev Notes

### Architecture Patterns & Constraints
- **Next.js 15:** Use App Router and React Server Components (RSCs) by default.
- **Supabase SSR:** Follow official SSR integration patterns for Next.js.
- **Theme:** Kanagawa Dark.
  - Base Surface: `#1f1f28` (Dragon)
  - Text Primary: `#dcd7ba` (Fuji)
  - Interactive/Primary: `#7e9cd8` (Crystal Blue)
  - Success State: `#98bb6c` (Spring Green)
  - Border/Subtle: `#2d4f67` (Suminkashi)
- **Typography:**
  - UI: `Geist Sans`
  - Content: `Geist Mono` (Mandatory for prompts, variable inputs, and previews)

### Project Structure
```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/
    shared/
  features/
  lib/
    supabase/
    utils/
```

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Selected: Next.js 15 + Supabase SSR (Manual Init)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List
- Initialized Next.js 15 app with TypeScript, Tailwind, ESLint, App Router.
- Initialized Shadcn UI with Zinc base color.
- Installed Supabase SSR dependencies.
- Configured Kanagawa theme colors in `src/app/globals.css`.
- Configured Geist fonts and updated Metadata.

### File List
- src/
- public/
- package.json
- tsconfig.json
- next.config.ts
- postcss.config.mjs
- eslint.config.mjs
- package-lock.json
- README.md
- .gitignore
- components.json
- src/lib/utils.ts
- src/app/globals.css
- src/app/layout.tsx
- vitest.config.ts
- vitest.setup.ts
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- src/app/page.tsx

## Change Log
- Downgraded Next.js to v15.x and React to v18.x to match architecture requirements.
- Updated `package.json` with correct project name and test script.
- Installed Vitest and configured testing environment.
- Created `src/lib/supabase` structure with client and server utilities.
- Removed boilerplate from `src/app/page.tsx` and applied correct Kanagawa theme classes.
- Removed temporary verification scripts.
