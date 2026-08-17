# MongoDB Tools

A focused collection of free, **client-side** MongoDB developer tools, implemented from
`mongodb_tools_product_reference.md`.

Every tool runs entirely in the browser. Nothing you paste is uploaded, logged, or shared.
Passwords are masked by default.

## Tools (MVP)

| Tool | URL |
| --- | --- |
| ObjectId → Timestamp (validate + generate) | `/tools/mongodb-objectid-timestamp/` |
| MongoDB URI Parser (`mongodb://`, `mongodb+srv://`) | `/tools/mongodb-uri-parser/` |
| MongoDB Query Formatter / Minifier | `/tools/mongodb-query-formatter/` |
| Aggregation Formatter / Minifier + stage list | `/tools/mongodb-aggregation-formatter/` |
| JSON → Mongoose Schema | `/tools/json-to-mongoose/` |

Plus: home, tools index, guides (2 articles), about, privacy, terms, 404.

## Stack

- Vite 5 + React 18 + TypeScript (strict)
- Tailwind CSS v4
- React Router 6 (lazy-loaded routes)
- Vitest unit tests, ESLint 9, Prettier
- No backend, no database, no analytics, no third-party scripts

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

## Scripts

```bash
npm test             # run unit tests (Vitest)
npm run typecheck    # TypeScript
npm run lint         # ESLint
npm run build        # typecheck + production build → dist/
npm run preview      # serve the production build locally
```

## Project structure

```text
src/
├── components/          # shared UI: ToolLayout, InputEditor, OutputArea, Copy/Clear,
│   └── layout/          #   ErrorMessage, ExampleSelector, PrivacyNotice, Seo, Header, Footer
├── data/                # tool registry (used by home, index, related links)
├── lib/                 # clipboard + download helpers
├── pages/
│   ├── tools/           # the five tool pages
│   └── guides/          # guide articles
└── tools/               # pure, testable engine logic (one folder per tool)
    ├── objectid/
    ├── uri-parser/
    ├── formatter/       # tokenizer/parser/printer shared by query + aggregation
    └── mongoose-generator/
```

Engine logic is separated from React so every parser/formatter/generator is unit-tested
(91 tests covering valid, invalid, empty, boundary, unicode, nesting, and security cases).

## Deployment notes

- The build is a static site (`dist/`).
- Configure `VITE_SITE_URL` (see `.env.example`) so canonical URLs and JSON-LD are emitted.
- Hosts serving a React Router SPA need a rewrite rule: send unknown paths to `index.html`
  (Netlify `_redirects`, Vercel `rewrites`, Nginx `try_files`, etc.).
- Pages are client-rendered; server prerendering/SSG can be added later if needed.

## Product notes

- All data is processed locally; see `/privacy/`.
- This project is independent and not affiliated with MongoDB, Inc.
- Implementation decisions (including where the source document was ambiguous) are recorded in
  [`DECISIONS.md`](./DECISIONS.md) for review.
# Mongo-Utils
# Mongo-Utils
