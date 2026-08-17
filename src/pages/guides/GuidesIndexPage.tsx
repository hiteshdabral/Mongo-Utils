import { Link } from "react-router-dom";
import Seo from "../../components/Seo";

const GUIDES = [
  {
    title: "How MongoDB ObjectId works",
    path: "/guides/how-mongodb-objectid-works/",
    description:
      "The 12-byte structure behind every ObjectId: timestamp, random bytes and counter — and how to extract the creation time.",
  },
  {
    title: "Anatomy of a MongoDB connection string",
    path: "/guides/mongodb-connection-string/",
    description:
      "Every part of mongodb:// and mongodb+srv:// URIs explained: credentials, hosts, database, and the options that matter.",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Seo
        title="MongoDB Guides — ObjectId, Connection Strings and More"
        description="Practical MongoDB guides for developers: how ObjectId works, connection strings explained, and aggregation examples."
        path="/guides/"
      />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Guides</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Short, practical articles answering real MongoDB developer questions. Each guide links to
        the tool that helps you apply it.
      </p>
      <ul className="mt-8 space-y-4">
        {GUIDES.map((guide) => (
          <li key={guide.path}>
            <Link
              to={guide.path}
              className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900 group-hover:text-emerald-800">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{guide.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        More guides are on the roadmap: MongoDB $lookup explained, $group examples, compound
        indexes, explain() and date range queries.
      </p>
    </div>
  );
}
