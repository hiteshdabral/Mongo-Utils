# Implementation Decisions Log

This document records every decision made while implementing the project described in
`mongodb_tools_product_reference.md`. Review these and flag anything you want changed.

## Scope

- Implemented **Phase 1 (foundation)** and **Phase 2 (all five MVP tools)** from the roadmap,
  plus `/about/`, `/privacy/`, `/terms/`, a tools index and two starter guides.
- **Deferred (not implemented):**
  - Phase 0 validation (keyword research, competition, domain/branding) — business work, not code.
  - Phase 3 deployment (domain, HTTPS, sitemap submission, analytics) — requires a real domain;
    everything is kept local per your instruction.
  - Analytics — shipped without any analytics. The privacy page states this and describes the
    future product-level-only events policy.
  - Playwright browser tests — only Vitest unit tests included, matching the doc's
    "add tests for every parser/formatter/generator" requirement. Playwright was listed as
    optional ("for critical browser flows").
  - Future tool catalog — explicitly out of scope per doc section 3 and rule 3 in section 22.
  - Remaining guide articles (only 2 of ~10 built as a pattern) and monetization.

## Stack decisions

1. **Vite + React 18 + TypeScript + React Router 6 + Tailwind CSS v4 + Vitest + ESLint 9 + Prettier.**
   Chosen for static deployability, developer familiarity, and minimal dependencies
   (the doc's "suggested stack"). Node 24 was available.
2. **No backend, no database, no auth, no Redis/queues** — per doc rules 11–13.
3. **No third-party scripts loaded** — no CDN fonts, no analytics.
4. **BrowserRouter with clean URLs** (e.g. `/tools/mongodb-uri-parser/`) for SEO. Note: static
   hosting needs an SPA rewrite rule (404 → index.html); noted in README.
5. **Route-level code splitting** via `React.lazy` so each tool loads only its own chunk
   (doc performance section).

## URL decisions

6. Tool URLs follow **doc section 14 (SEO examples)** rather than section 5's shorter slugs:
   - `/tools/mongodb-objectid-timestamp/`
   - `/tools/mongodb-uri-parser/`
   - `/tools/mongodb-query-formatter/`
   - `/tools/mongodb-aggregation-formatter/`
   - `/tools/json-to-mongoose/`
   Section 5 and section 14 disagree; section 14 is the authoritative SEO list.
7. Canonical URLs and JSON-LD `url` fields are emitted **only when `VITE_SITE_URL` is set**
   (see `.env.example`), because the production domain is not decided yet.

## Branding

8. Working brand: **"MongoDB Tools — The developer toolbox for MongoDB"**. Final branding is a
   Phase 0 decision. Footer and Terms carry an explicit "not affiliated with MongoDB, Inc."
   disclaimer with nominative trademark use.

## Tool engine decisions

9. **Query/Aggregation Formatter: custom safe tokenizer + parser.** It never evaluates user
   input (doc rule: "never execute arbitrary user-provided JavaScript"). Object/array literals
   in value position are parsed and pretty-printed; everything else (wrappers like
   `db.users.find(`, method chains, `ObjectId(...)`, function bodies) is preserved verbatim with
   normalized whitespace. This is deliberately not a full JS parser (doc MVP-03 note).
10. **Doc example inconsistency fixed:** MVP-03's input nests `status` inside `age` but its
    output shows them as siblings. The formatter matches the doc's intended output; the test
    uses the corrected input.
11. Formatter behavior details: double quotes kept as-is; single quotes preserved; regex
    literals supported in value position; `//` and `/* */` comments skipped; short primitive
    arrays stay inline (≤72 chars); no trailing commas; 2-space indent.
12. **URI parser: custom hand-rolled parser** (not `new URL(...)`) to correctly handle MongoDB
    specifics: `mongodb+srv://` (no port, single host, no path db), multiple comma-separated
    hosts, unbracketed IPv6 shorthand, and the last-`@` credential split.
13. Passwords are **masked by default** everywhere (results table, copied summary). Reveal is a
    local toggle. Masked value is what gets copied.
14. **JSON → Mongoose**: nested objects → `new mongoose.Schema({...})`; arrays of objects →
    `[new mongoose.Schema({...})]`; `null`/empty object → `Schema.Types.Mixed`; empty array →
    `[]`; mixed arrays → `[Schema.Types.Mixed]`; array root input uses the first element.
15. Schema generator output includes **both** the `XxxSchema` constant and the
    `mongoose.model(...)` export (the doc's example only shows the schema const; the model line
    satisfies "generate model name"). No `require`/`import` header emitted.
16. Model name input defaults to **"User"** and is sanitized to PascalCase (`blog posts` →
    `BlogPosts`); empty → `Document`.
17. **ObjectId**: strict 24-hex validation; shows Unix seconds, UTC ISO, local date, and
    machine/counter bytes. Generation uses `crypto.getRandomValues` with a `Math.random`
    fallback.
18. Aggregation page lists **stages as chips linking to MongoDB's official docs**, with a
    fallback URL for stages without a mapping.

## UX decisions

19. Tool pages follow the doc's standard structure: title → description → privacy notice →
    input → actions → output → how it works → examples → common use cases → FAQ → related tools.
20. **Cmd/Ctrl+Enter** runs each tool (the doc defers keyboard shortcuts; this one was cheap).
21. Light UI with dark code areas (developer-tool aesthetic). No dark-mode toggle.
22. User input is **never placed in URLs** (no share-links) — privacy rule.
23. Copy uses the async Clipboard API with an `execCommand` fallback; Download generates a
    Blob client-side.

## Content decisions

24. Two guides shipped as the article→tool CTA pattern from section 15:
    "How MongoDB ObjectId works" and "Anatomy of a MongoDB connection string". The remaining
    guide topics are listed on the guides index as planned.
25. Homepage and tools index are thin on purpose — five tools, no filler pages (doc rule:
    "do not create hundreds of thin pages just for SEO").

## Known limitations

- Query formatter is intentionally not a full JS parser (doc-sanctioned). Exotic syntax is
  preserved as-is or reported as an error.
- SPA SEO is client-rendered; server-side prerendering/SSG is a future improvement if needed
  after launch.
- `npm install` reports 7 audit findings in the dev dependency tree (Vite/Vitest transitive).
  No production dependencies are affected; review before release.
