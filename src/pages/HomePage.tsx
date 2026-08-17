import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { TOOLS } from "../data/toolRegistry";

export default function HomePage() {
  return (
    <div>
      <Seo
        title="MongoDB Tools — Free MongoDB Developer Utilities"
        description="Free, client-side MongoDB tools: ObjectId timestamp converter, URI parser, query and aggregation formatters, and JSON to Mongoose schema generator. No sign-up, no uploads."
        path="/"
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:py-20">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            <span aria-hidden="true">🔒</span> 100% client-side · processed in your browser
          </p>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            MongoDB tools for developers
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            A focused toolbox for MongoDB developers, backend engineers, and DevOps teams. Fast,
            reliable utilities that run entirely in your browser — no sign-up, no uploads.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/tools/"
              className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
            >
              Browse all tools
            </Link>
            <Link
              to="/tools/mongodb-uri-parser/"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-100"
            >
              Parse a connection string
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 id="tools-heading" className="text-2xl font-bold text-slate-900">
          Tools
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-800">
                {tool.shortTitle}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.description}</p>
              <span className="mt-4 text-sm font-semibold text-emerald-700">Open tool →</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="why-heading" className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <h2 id="why-heading" className="text-2xl font-bold text-slate-900">
            Why these tools are different
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-slate-900">Private by design</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Connection strings, queries, and documents never leave your browser. Nothing you
                paste is uploaded, logged, or shared.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Instant, no sign-up</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Every tool answers three questions immediately: what it does, what to paste, and
                what you get back. No account required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Composable workflow</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                Move naturally between tools: parse a URI, format a query, format a pipeline, then
                generate a schema.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
