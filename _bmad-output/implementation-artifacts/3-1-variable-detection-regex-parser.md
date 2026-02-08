# Story 3.1: Variable Detection & Regex Parser

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to implement a robust regex-based parser for `{{variable}}` syntax,
so that I can extract dynamic fields from any prompt template for the resolution engine.

## Acceptance Criteria

1. **Given** a prompt string containing `{{one}}` and `{{two}}`
   **When** the resolution engine parses the string
   **Then** it returns a unique list of variable names: `['one', 'two']`
2. **And** it handles edge cases like spaces inside brackets `{{ with spaces }}` (resulting in `['with spaces']`)
3. **And** it handles special characters within the variable name (e.g., `{{user_name}}`, `{{api-key}}`)
4. **And** it ignores malformed tags like `{variable}` or `{{variable}`
5. **And** the parser is implemented as a reusable utility function in `src/lib/utils/` or a dedicated feature lib
6. **And** comprehensive unit tests cover all edge cases and performance requirements (NFR1: <50ms parsing)

## Tasks / Subtasks

- [x] Create Regex Parser Utility: `src/lib/utils/variable-parser.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Implement `extractVariables(content: string): string[]` function
  - [x] Use a non-greedy regex that captures content between `{{` and `}}`
  - [x] Ensure extracted names are trimmed and duplicates are removed
- [x] Implement Comprehensive Tests: `src/lib/utils/variable-parser.test.ts` (AC: #6)
  - [x] Test with multiple variables
  - [x] Test with spaces: `{{ var }}`
  - [x] Test with internal spaces: `{{ var name }}`
  - [x] Test with special characters: `{{user_id}}`, `{{my-var}}`, `{{var.prop}}`
  - [x] Test with malformed input
  - [x] Test with empty string or string without variables
- [x] Benchmarking Parsing Speed: (AC: #6)
  - [x] Add a performance test case to ensure <50ms for large strings (e.g. 10KB)

## Dev Notes

- **Architecture Pattern:** Reusable utility following the project's structure in `src/lib/utils/`.
- **Regex Guardrails:** Use `/\{\{\s*([\s\S]+?)\s*\}\}/g` to capture content between braces. Trim the resulting match to handle leading/trailing spaces within the braces.
- **Performance:** NFR1 requires <50ms. Native JS regex is extremely fast, but ensure we aren't doing unnecessary copies in a loop.
- **Deduplication:** Use `Array.from(new Set(matches))` or similar to ensure the returned list is unique.

### Project Structure Notes

- Architecture doc suggests `src/features/resolution-engine/` for feature-specific logic. However, since the parser is a pure utility that might be used by both the backend (validation) and frontend (form generation), placing the core regex logic in `src/lib/utils/variable-parser.ts` is appropriate.
- Feature-specific UI will follow in story 3.2.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: Variable Detection & Regex Parser]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements (FR9)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

- Verified regex `\{\{\s*([^}]+?)\s*\}\}/g` correctly captures multiline content and handles spaces.
- Performance test confirmed <1ms for 1000 variables (approx 7KB).
- **Code Review Fixes:** Optimized regex to avoid catastrophic backtracking, updated JSDoc for edge cases, and switched to spread operator for Array conversion.

### Completion Notes List

- Created `src/lib/utils/variable-parser.ts` with `extractVariables` function.
- Created `src/lib/utils/variable-parser.test.ts` with comprehensive coverage.
- Organized `src/lib/utils` directory to accommodate new utilities.
- Resolved code review findings regarding file documentation and regex optimization.

### File List

- `src/lib/utils/variable-parser.ts`
- `src/lib/utils/variable-parser.test.ts`
- `src/lib/utils/index.ts`
- `src/lib/utils/cn.ts`
- `src/lib/utils.ts` (Deleted/Moved)
