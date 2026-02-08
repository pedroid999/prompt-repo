---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-prompt-repo-2026-02-07.md
workflowType: prd
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - prompt-repo

**Author:** pedroid
**Date:** 2026-02-07

## Executive Summary
PromptRepo is a high-performance "Git for prompts" designed to treat AI prompts as first-class, versioned, and templated artifacts. It solves the problem of prompt fragmentation by providing a single source of truth for developers to organize, refine, and rapidly reuse their prompt library. The tool is optimized for a high-velocity, sidecar workflow where prompts are searched, resolved via dynamic variable forms, and copied for immediate use in LLM interfaces.

---

## Success Criteria

### User Success
- **Frictionless Resolution:** 90%+ form completion rate for prompts with variables, indicating the "magic" of automated variable detection is working.
- **Workflow Integration:** PromptRepo becomes the "permanent tab" next to the IDE; users stop hunting for prompts in local files or chat histories.
- **Craftsmanship Confidence:** Users experiment freely with prompt tweaks, knowing their "golden versions" are safely preserved via immutable versioning.

### Business Success
- **Traction & Validation:** Acquisition of 20 "Prompt Architect" early adopters within the first 30 days.
- **High-Utility Retention:** A D7 retention rate of 25%, signaling successful integration into daily professional routines.
- **Utility Proof:** Reaching 500 total "Resolved Prompts Copied" across the user base.

### Technical Success
- **Sub-100ms Search:** Results render nearly instantaneously, maintaining the high-velocity developer experience.
- **Strict Immutability:** Saved versions are immutable and assigned permanent IDs for an accurate historical record.
- **Zero-Friction Auth:** Seamless onboarding via GitHub and Google OAuth.

### Measurable Outcomes
- **Search-to-Copy Time:** Average of < 20 seconds from start-of-search to clipboard.
- **Activation Rate:** 50% of users create a collection and a variable-rich prompt within their first session.
- **Dogfooding:** 100% of the creator's complex prompt interactions managed through PromptRepo within 14 days of launch.

---

## User Journeys

### Journey 1: The Core Craftsmanship (Happy Path)
**Persona:** Alex (The Prompt Architect) in "Flow State"
- **Scene:** Alex hits a Rust borrowing error at 11 PM and needs a specific "Architectural Review" prompt.
- **Action:** Alex searches "arch review" in PromptRepo. Results appear in <100ms. They select the top result.
- **The Magic:** A modal appears with fields for `{{tech_stack}}` and `{{error_context}}`. Alex types "Rust, Axum" and pastes the error log.
- **Climax:** Alex hits `Cmd+Enter`. The system resolves the template and copies it to the clipboard.
- **Resolution:** Alex pastes the resolved prompt into Claude. The AI fixes the code. Total time: 12 seconds.

### Journey 2: The "Version Regret" (Recovery)
**Persona:** Alex in "Refinement Mode"
- **Scene:** Alex "optimizes" a Unit Test Generator prompt but makes it too terse (v14).
- **Action:** Realizing the error, Alex opens the prompt's "History" tab and reviews previous versions.
- **Climax:** Alex identifies v13 as the "golden" version and clicks "Restore."
- **Resolution:** A new v15 is created with the content of v13. Alex adds a note: "Reverted v14 optimization—too terse."

### Journey 3: The Vault Custodian (Maintenance)
**Persona:** Alex (The System Admin)
- **Action:** Alex creates a "Rust Projects" Collection to organize 50 uncategorized prompts.
- **Resolution:** Using batch-select, Alex moves 10 prompts into the new collection. The system feels orderly and professional.

### Journey Requirements Summary
- **Core Capabilities:** High-performance indexing, dynamic form generation (regex), immutable history, and collection management.
- **UX Requirements:** Keyboard-first navigation, non-destructive auto-versioning, and clean "reading mode" UI.

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**Approach:** **Experience MVP.** We must prove that a versioned, templated vault is vastly superior to flat notes. Success is Alex abandoning his markdown files.
**Resources:** Solo full-stack developer (Next.js/Supabase).

### MVP Feature Set (Phase 1)
- **Auth:** GitHub & Google OAuth via Supabase.
- **Versioning:** Immutable saves with mandatory "Version Notes."
- **Templating:** Robust `{{variable}}` detection and auto-generated resolution forms.
- **Search:** Sub-100ms full-text search (tsvector).
- **Organization:** Multi-prompt collection assignments.

### Post-MVP Features
- **Phase 2 (Growth):** Visual diffs between versions, public read-only collection links, and model-specific metadata tags.
- **Phase 3 (Expansion):** Prompt Chaining (multi-step workflows), CLI/IDE extensions, and AI-assisted optimization suggestions.

---

## Web App Specific Requirements

### Technical Architecture
- **Rendering:** Hybrid Model. RSCs for layout/fetching; Client Components for the "Resolution Engine" (regex/preview).
- **State:** Server Actions with `useOptimistic` for instant save feedback.
- **Database:** PostgreSQL with `tsvector` indexing and RLS security policies.

### Performance & UI
- **Browser:** Modern evergreen browsers only.
- **Search/Resolution:** <100ms search results; <50ms variable parsing.
- **UI Density:** "Sidebar Priority" design optimized for 400px–600px narrow viewports.
- **Accessibility:** WCAG 2.1 AA with full keyboard navigability (e.g., `Cmd+K` for search).

---

## Functional Requirements

### Identity & Access
- **FR1:** Users can create an account using email/password.
- **FR2:** Users can sign in/sign out securely using GitHub or Google OAuth.
- **FR3:** Users can manage their basic profile information.
- **FR4:** Strict multi-tenancy: Users only access their own prompts, versions, and collections.

### Prompt & Version Management
- **FR5:** Users can create, edit, and delete prompts (Title, Description, Content, Tags).
- **FR6:** System automatically creates an immutable version on every save.
- **FR7:** Users can provide a "Version Note" during save.
- **FR8:** Users can view chronological history, view historical content, and restore previous versions.

### Templating & Discovery
- **FR9:** System detects `{{variable}}` syntax and generates a dynamic input form.
- **FR10:** System provides a real-time "resolved" prompt preview.
- **FR11:** Users can copy the resolved prompt with one click.
- **FR12:** Users can perform sub-100ms full-text search and filter by tags/collections.
- **FR13:** Users can organize prompts into multiple named Collections.

---

## Non-Functional Requirements

### Performance & UX
- **NFR1 (Latency):** Global search < 100ms; Variable form generation < 50ms.
- **NFR2 (Snappiness):** Resolved preview updates < 16ms (60fps); "Copied" feedback < 100ms.
- **NFR3 (Accessibility):** 100% of core "Search -> Resolve -> Copy" loop is keyboard-completable.
- **NFR4 (Density):** UI remains fully functional at 400px width for sidebar use.

### Security & Reliability
- **NFR5 (Isolation):** Verified RLS policies ensuring zero cross-tenant data leakage.
- **NFR6 (Encryption):** Data encrypted at rest and in transit (TLS 1.2+).
- **NFR7 (Integrity):** Guaranteed immutability of historical prompt versions.
- **NFR8 (Uptime):** 99.9% availability via Vercel Edge.

---

## Innovation & Novel Patterns
- **Paradigm Shift:** Moving from "Prompt Notes" to "Prompt Repos," introducing engineering rigor to prompt craftsmanship.
- **Operational Efficiency:** The Dynamic Resolution Engine eliminates the manual "replace-all" friction of current prompt reuse.
- **Focused DX:** Laser-focus on the individual's high-speed "pre-production" workflow rather than enterprise observability.