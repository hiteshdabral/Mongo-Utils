import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { TOOLS } from "../data/toolRegistry";

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Seo
        title="All MongoDB Tools — Free Client-Side Utilities"
        description="Browse every free MongoDB tool: ObjectId converter, URI parser, query formatter, aggregation formatter and JSON to Mongoose schema generator."
        path="/tools/"
      />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">All tools</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Every tool runs entirely in your browser and works without a database or an account.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <li key={tool.path}>
            <Link
              to={tool.path}
              className="group block h-full rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900 group-hover:text-emerald-800">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tool.description}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-emerald-700">
                Open tool →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
