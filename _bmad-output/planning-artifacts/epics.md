---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# prompt-repo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for prompt-repo, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create an account using email/password.
FR2: Users can sign in/sign out securely using GitHub or Google OAuth.
FR3: Users can manage their basic profile information.
FR4: Strict multi-tenancy: Users only access their own prompts, versions, and collections.
FR5: Users can create, edit, and delete prompts (Title, Description, Content, Tags).
FR6: System automatically creates an immutable version on every save.
FR7: Users can provide a "Version Note" during save.
FR8: Users can view chronological history, view historical content, and restore previous versions.
FR9: System detects {{variable}} syntax and generates a dynamic input form.
FR10: System provides a real-time "resolved" prompt preview.
FR11: Users can copy the resolved prompt with one click.
FR12: Users can perform sub-100ms full-text search and filter by tags/collections.
FR13: Users can organize prompts into multiple named Collections.
FR14: Users can save a "Snapshot" of a resolved prompt, preserving both the template version and the specific variable values used.
FR15: Users can view a list of Snapshots for a specific prompt and copy the resolved content with one click.
FR16: Users can "Re-resolve" from a Snapshot, opening the resolution form with all variable fields pre-filled from the saved state.

### NonFunctional Requirements

NFR1 (Latency): Global search < 100ms; Variable form generation < 50ms.
NFR2 (Snappiness): Resolved preview updates < 16ms (60fps); "Copied" feedback < 100ms.
NFR3 (Accessibility): 100% of core "Search -> Resolve -> Copy" loop is keyboard-completable.
NFR4 (Density): UI remains fully functional at 400px width for sidebar use.
NFR5 (Isolation): Verified data isolation policies ensuring zero cross-tenant data leakage.
NFR6 (Encryption): Data encrypted at rest (database storage) and in transit (TLS 1.2+).
NFR7 (Integrity): Guaranteed immutability of historical prompt versions.
NFR8 (Uptime): 99.9% availability via global edge network.
NFR9 (Snapshot Latency): Snapshot retrieval and form pre-filling < 50ms.

### Additional Requirements

- **Starter Template**: Next.js 15 + Supabase SSR (Manual Init) is required.
- **Initialization Command**: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` followed by shadcn and supabase install.
- **Database Schema**: Two-Table Pattern (prompts + prompt_versions) for Phase 1; `prompt_snapshots` table with `jsonb` for Phase 2.
- **Search Architecture**: PostgreSQL tsvector with GIN index for sub-100ms performance.
- **State Management**: React Hook Form + Zod for the Resolution Engine.
- **UI System**: shadcn/ui + Tailwind with Kanagawa theme (Dragon/Fuji/Crystal Blue).
- **UX Constraints**: Sidebar-first design (400px-600px) with Geist Mono for all content.
- **Keyboard Navigation**: Cmd+K (Search), Cmd+S (Save Snapshot), D (Diff), Cmd+Enter (Resolve/Copy), Esc (Close).
- **Phase 2 Patterns**: `hydrateResolutionForm` utility for Snapshot-to-Form mapping.
- **Phase 2 Patterns**: `DiffViewer` component for client-side text comparisons using `diff` library (v8.0.3).
- **Accessibility**: WCAG 2.1 AA with full keyboard navigability.

### FR Coverage Map

FR1: Epic 1 - Identity & Access
FR2: Epic 1 - Identity & Access
FR3: Epic 1 - Identity & Access
FR4: Epic 1 - Identity & Access
FR5: Epic 2 - Core Prompt Management
FR6: Epic 2 - Core Prompt Management
FR7: Epic 2 - Core Prompt Management
FR8: Epic 2 - Core Prompt Management
FR9: Epic 3 - Resolution Engine
FR10: Epic 3 - Resolution Engine
FR11: Epic 3 - Resolution Engine
FR12: Epic 4 - Discovery & Organization
FR13: Epic 4 - Discovery & Organization
FR14: Epic 5 - Snapshots & UX Polish
FR15: Epic 5 - Snapshots & UX Polish
FR16: Epic 5 - Snapshots & UX Polish

## Epic List

### Epic 1: Foundation & Identity
Establish the high-performance application shell and secure user identity system so users can safely access their private workspace.
**FRs covered:** FR1, FR2, FR3, FR4

### Epic 2: Core Prompt Management
Enable the creation and versioned storage of prompts, forming the "Git" backbone of the system.
**FRs covered:** FR5, FR6, FR7, FR8

### Epic 3: Resolution Engine
Transform static text into dynamic, reusable tools via the "Magic" variable detection system.
**FRs covered:** FR9, FR10, FR11

### Epic 4: Discovery & Organization
Provide high-velocity search and organizational tools needed to manage a growing library.
**FRs covered:** FR12, FR13

### Epic 5: Snapshots & UX Polish (Phase 2)
Enable persistent state management via Snapshots and provide deep analytical clarity through Visual Diffs.
**FRs covered:** FR14, FR15, FR16, Journey 2 (Visual Diffs)

## Epic 1: Foundation & Identity

Establish the high-performance application shell and secure user identity system so users can safely access their private workspace.

### Story 1.1: Project Initialization & Foundation

As a developer,
I want to initialize the project with Next.js 15, Shadcn UI, and Supabase SSR,
So that I have a performant and secure foundation for building features.

**Acceptance Criteria:**

**Given** the project directory is empty
**When** I run the initialization commands (Next.js 15, Shadcn UI with Zinc theme, Supabase SSR)
**Then** a functional Next.js 15 app is created with the `/src` directory structure
**And** the Kanagawa theme colors are applied to the Tailwind configuration
**And** Geist Mono is set as the default typeface for all content

### Story 1.2: Database Foundation & Multi-tenant RLS

As a developer,
I want to set up the base Supabase schema with strict RLS policies,
So that all user data is isolated and secure from the start.

**Acceptance Criteria:**

**Given** a new Supabase project
**When** I deploy the initial migration with `auth.users` references
**Then** Row Level Security (RLS) is enabled for all tables
**And** policies are created to ensure users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` their own records based on `auth.uid()`

### Story 1.3: Secure Authentication (OAuth & Email)

As a user,
I want to sign in via GitHub, Google, or Email,
So that I can securely access my private prompt library.

**Acceptance Criteria:**

**Given** I am on the `/auth/login` page
**When** I select GitHub/Google OAuth or enter my email/password
**Then** I am authenticated via Supabase SSR and redirected to the main library page
**And** a secure session cookie is established via Next.js middleware
**And** I can sign out to invalidate my session

### Story 1.4: User Profile Management

As a user,
I want to view and update my basic profile information,
So that I can manage my identity within the application.

**Acceptance Criteria:**

**Given** I am an authenticated user
**When** I navigate to the profile section and update my display name or avatar
**Then** the changes are saved to the Supabase `profiles` table
**And** the UI reflects the updates immediately using optimistic UI patterns

## Epic 2: Core Prompt Management

Enable the creation and versioned storage of prompts, forming the "Git" backbone of the system.

### Story 2.1: Prompt Database Schema (Two-Table Pattern)

As a developer,
I want to implement the two-table prompt schema in PostgreSQL,
So that I can separate active prompt data from immutable version history for performance and integrity.

**Acceptance Criteria:**

**Given** a Supabase database
**When** I run the migration for `prompts` and `prompt_versions` tables
**Then** the `prompts` table stores current metadata (ID, Title, Description, UserID)
**And** the `prompt_versions` table stores immutable content and version notes
**And** strict snake_case is used for all column names per architectural standards

### Story 2.2: Create & Versioned Save Logic

As a user,
I want to create and save a new prompt with a version note,
So that the system automatically creates a new immutable version in the history.

**Acceptance Criteria:**

**Given** I am on the "Create Prompt" screen
**When** I enter a title and content and click "Save"
**Then** a new record is created in `prompts`
**And** a corresponding entry is created in `prompt_versions` with `version_number: 1`
**And** the operation is performed via a atomic transaction or Server Action

### Story 2.3: Prompt List & Detail View

As a user,
I want to browse my library of prompts and view the details of a specific prompt,
So that I can manage my collected prompt assets.

**Acceptance Criteria:**

**Given** I have saved prompts in my library
**When** I view the library list
**Then** I see high-density cards with titles and descriptions using Kanagawa styling
**And** clicking a prompt shows the detail view with the most recent version content in Geist Mono

### Story 2.4: Version History & Restoration

As a user,
I want to view the chronological history of a prompt and restore a previous version,
So that I can recover from mistakes or revert to "golden" versions.

**Acceptance Criteria:**

**Given** a prompt with multiple versions
**When** I open the "History" tab
**Then** I see a vertical timeline of versions with their notes and timestamps
**And** clicking "Restore" on an old version creates a NEW version with that content (HEAD remains immutable)

## Epic 3: Resolution Engine

Transform static text into dynamic, reusable tools via the "Magic" variable detection system.

### Story 3.1: Variable Detection & Regex Parser

As a developer,
I want to implement a robust regex-based parser for `{{variable}}` syntax,
So that I can extract dynamic fields from any prompt template.

**Acceptance Criteria:**

**Given** a prompt string containing `{{one}}` and `{{two}}`
**When** the resolution engine parses the string
**Then** it returns a unique list of variable names
**And** it handles edge cases like spaces inside brackets `{{ with spaces }}` or special characters

### Story 3.2: Dynamic Resolution Form (Just-in-Time UI)

As a user,
I want the system to instantly generate an input form based on my prompt's variables,
So that I can customize the prompt without manual find-and-replace.

**Acceptance Criteria:**

**Given** I select a prompt with variables
**When** I enter "Resolution Mode"
**Then** a form appears with an input field for every detected variable
**And** the first field is automatically focused for immediate typing
**And** the form is managed via React Hook Form for sub-50ms performance

### Story 3.3: Real-time Resolved Preview

As a user,
I want to see a live preview of my resolved prompt as I type into the form fields,
So that I am confident in the final output before copying.

**Acceptance Criteria:**

**Given** I am typing in the dynamic resolution form
**When** I update a field value
**Then** a monospaced preview block updates in real-time (<16ms) to show the final resolved string
**And** the preview uses Geist Mono and respects the Kanagawa theme styling

### Story 3.4: One-Click Copy & Clipboard Feedback

As a user,
I want to copy the fully resolved prompt to my clipboard with one click or shortcut,
So that I can immediately paste it into my LLM interface.

**Acceptance Criteria:**

**Given** I have filled in my variables
**When** I click "Copy" or use the `Cmd+Enter` shortcut
**Then** the resolved string is copied to the system clipboard
**And** a "Copied" toast notification appears in Spring Green for immediate confirmation

## Epic 4: Discovery & Organization

Provide the high-velocity search and organizational tools needed to manage a growing library.

### Story 4.1: High-Performance Full-Text Search

As a developer,
I want to implement PostgreSQL `tsvector` indexing for the prompt library,
So that searches remain sub-100ms even as the library grows.

**Acceptance Criteria:**

**Given** a library of 100+ prompts
**When** I search for a keyword via the search bar
**Then** results are returned in <100ms using a GIN index on `tsvector` columns (Title, Description, Content)
**And** the search supports partial matches and keyword relevance

### Story 4.2: Global Command Palette (Cmd+K)

As a user,
I want to navigate and search my library using a keyboard-first command palette,
So that I can maintain my flow state without touching the mouse.

**Acceptance Criteria:**

**Given** I am anywhere in the application
**When** I press `Cmd+K` (or `Ctrl+K`)
**Then** a global search overlay appears
**And** typing immediately filters the prompt list
**And** using arrow keys and `Enter` allows me to select and open a prompt

### Story 4.3: Collections Management

As a user,
I want to organize my prompts into custom Collections,
So that I can group related assets for different projects or workflows.

**Acceptance Criteria:**

**Given** I have multiple prompts
**When** I create a new Collection and assign prompts to it
**Then** the prompts are correctly associated in the database
**And** I can filter my library view by selecting a specific Collection

### Story 4.4: UI Density & Sidebar Resilience

As a user,
I want the application to remain fully functional and legible in a narrow 400px window,
So that I can use it as a persistent sidecar next to my IDE.

**Acceptance Criteria:**

**Given** I resize my browser window to 400px
**When** I use the Search -> Resolve -> Copy flow
**Then** no content is clipped and all interactive elements remain accessible
**And** high-density padding and Geist Mono typography ensure information is readable in the narrow view

## Epic 5: Snapshots & UX Polish (Phase 2)

Enable persistent state management via Snapshots and provide deep analytical clarity through Visual Diffs.

### Story 5.1: Snapshot Database Schema & RLS

As a developer,
I want to implement the `prompt_snapshots` table with strict RLS,
So that users can securely save their resolution states.

**Acceptance Criteria:**

**Given** a Supabase database
**When** I run the migration for the `prompt_snapshots` table
**Then** the table includes `id`, `user_id`, `prompt_version_id`, `name`, and `variables` (`jsonb`)
**And** RLS policies ensure users can only access their own snapshots based on `auth.uid()`

### Story 5.2: Save Snapshot & Listing

As a user,
I want to save a "Snapshot" of my current resolution variables,
So that I can reuse them later.

**Acceptance Criteria:**

**Given** I am in Resolution Mode with variables filled
**When** I click "Save Snapshot" or use `Cmd+S`
**Then** the current variable state and name are saved to the database
**And** I can see a list of saved snapshots for that specific prompt

### Story 5.3: Snapshot Re-resolution (Hydration)

As a user,
I want to select a snapshot and have the resolution form pre-filled,
So that I can copy the resolved prompt instantly.

**Acceptance Criteria:**

**Given** a prompt has saved snapshots
**When** I select a snapshot from the list or search
**Then** the Resolution Engine hydrates the form fields with the saved `jsonb` values in < 50ms
**And** the preview updates immediately to show the resolved string

### Story 5.4: Visual Diff Engine & UI

As a user,
I want to see a color-coded diff between two prompt versions,
So that I can understand exactly what changed.

**Acceptance Criteria:**

**Given** I am in the History view
**When** I select two versions to compare or trigger the "Diff" action (shortcut `D`)
**Then** a monospaced view highlights additions in Emerald and deletions in Rose
**And** the diff is calculated client-side using the `diff` library for sub-16ms responsiveness
