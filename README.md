# Aivre — UAD 3.6-Native Appraisal Workspace (v1)

A residential appraisal workspace built around the **UAD 3.6 dataset**, not legacy forms.
The report layout is derived from subject + assignment characteristics (dynamic URAR);
every action moves the file toward a clean UCDP package (MISMO 3.6 XML + PDF + images).

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

## What's in v1

| Screen | Route | Notes |
| --- | --- | --- |
| Orders dashboard | `/` | Sortable/filterable/keyboard-navigable; live compliance dots |
| Report workspace | `/orders/[id]` | Dynamic section rail · always-on QC panel · AI drawer |
| Mobile inspection | `/orders/[id]/inspect` | One-handed field use: photos, C/Q ratings, quick entry |

Workspace shortcuts: `[` / `]` switch sections · `.` toggles the AI drawer ·
in the comp grid, `Enter` commits + moves down, `Ctrl+arrows` move between cells.

Seeded orders cover the dynamic URAR: SFR purchase mid-report (#1001), condo refi (#1002),
complete/green SFR (#1003), 2–4 unit with an ANSI sketch mismatch (#1004), manufactured
overdue (#1005). The header's "Viewing as" switcher exercises the role gates
(Appraiser / Trainee / Supervisor — trainee work requires supervisor sign-off).

## Architecture

- **`lib/types.ts`** — UAD 3.6-native domain model. Every machine-populatable field is
  `Sourced<T>` (value + `Provenance`); every AI output is an `AISuggestion` until a human
  accepts it; `audit[]` is append-only.
- **`lib/uad/fields.ts`** — the field registry: one source of truth driving the intake forms,
  required-field blockers, and completeness %. `deriveSections()` turns dynamic-URAR sections
  on/off from the subject (condo project, manufactured, rent schedule…) — no form switch.
- **`lib/qc/rules.ts`** — pure-function rules engine (Blocker / Warning / Note), recomputed
  on every edit. Blockers gate the UCDP package build.
- **`lib/comp.ts`** — sales-comparison math: net/gross/adjusted price, guideline flags
  (distance, sale age, GLA delta, line/net/gross limits) — all synchronous, no spinners.
- **`lib/store.ts`** — Zustand store. QC + completeness are derived selectors, not state.
  Every mutation appends an audit entry. `useCurrentUser()` / `useTenant()` stub real auth.

## Integration seams (typed mocks today, real services later)

| Seam | File | Replaces |
| --- | --- | --- |
| `// SEAM: dataService` | `lib/services/dataService.ts` | MLS / public record / flood / census |
| `// SEAM: compService` | `lib/services/compService.ts` | Comp search + ranking |
| `// SEAM: llmService` | `lib/services/llmService.ts` | Model wiring + vision photo labeling |
| `// SEAM: exportService` | `lib/services/exportService.ts` | MISMO 3.6 XML + PDF + ZIP |
| `// SEAM: submissionService` | `lib/services/submissionService.ts` | UCDP / EAD submission |

LLM contract (enforced by the future system prompt, honored by the mock): output only from
supplied structured data — say "insufficient data" rather than fabricate; return structured
suggestions, never prose dumped into fields; always cite the source fields used.

## Domain invariants the code enforces

1. The appraiser is the decision-maker: AI never writes a value without an explicit accept,
   and never touches the value opinion, adjustments, or C/Q ratings on its own.
2. ANSI Z765-2021: sketch above-grade total must reconcile with reported GLA (blocker).
3. Provenance everywhere: autofilled/AI values carry source + timestamp chips and are
   overridable; overrides re-stamp provenance and hit the audit trail.
4. USPAP: the workfile (full dataset + audit) exports as JSON; trainee reports route to a
   supervisor for sign-off before the package can be built.
