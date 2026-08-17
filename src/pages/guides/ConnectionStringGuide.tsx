import { Link } from "react-router-dom";
import Seo from "../../components/Seo";

export default function ConnectionStringGuide() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <Seo
        title="Anatomy of a MongoDB Connection String (URI)"
        description="Every part of mongodb:// and mongodb+srv:// connection strings explained: credentials, hosts, database, and the most useful options."
        path="/guides/mongodb-connection-string/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: "Anatomy of a MongoDB Connection String",
          about: "MongoDB URI format and options",
        }}
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Anatomy of a MongoDB connection string
      </h1>
      <p className="mt-3 text-slate-500">
        What every part of <code>mongodb://</code> and <code>mongodb+srv://</code> means.
      </p>

      <section className="mt-8 space-y-4 text-[15px] leading-7 text-slate-700">
        <p>A MongoDB connection string follows the standard URI shape:</p>
        <pre className="code-scroll overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
{`mongodb://user:password@host1:27017,host2:27017/mydb?replicaSet=rs0&authSource=admin`}
        </pre>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Scheme</strong> — <code>mongodb://</code> for direct hosts,{" "}
            <code>mongodb+srv://</code> to discover hosts through DNS (what Atlas uses).
          </li>
          <li>
            <strong>Credentials</strong> — optional <code>username:password</code>, percent-encoded
            when they contain special characters.
          </li>
          <li>
            <strong>Hosts</strong> — one or more comma-separated <code>host:port</code> entries;
            27017 is the default port.
          </li>
          <li>
            <strong>Database</strong> — the default database after connecting.
          </li>
          <li>
            <strong>Options</strong> — query parameters such as <code>replicaSet</code>,{" "}
            <code>authSource</code>, <code>tls</code>, and <code>retryWrites</code>.
          </li>
        </ul>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Common options worth knowing</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <code>authSource=admin</code> — where credentials are checked (needed for most Atlas
            users).
          </li>
          <li>
            <code>replicaSet=rs0</code> — the replica set to connect to.
          </li>
          <li>
            <code>retryWrites=true</code> — enables retryable writes (default in modern drivers).
          </li>
          <li>
            <code>tls=true</code> — encrypt the connection.
          </li>
          <li>
            <code>appName=my-app</code> — label connections in server logs and monitoring.
          </li>
        </ul>
        <h2 className="pt-2 text-xl font-bold text-slate-900">A note on SRV strings</h2>
        <p>
          <code>mongodb+srv://</code> strings take a single hostname and no port — both are
          resolved from DNS. A database name in the path is discouraged; pass it through{" "}
          <code>authSource</code> instead.
        </p>
        <p>
          When debugging connection issues, parse the string first: it surfaces the hosts,
          credentials, and options at a glance — without ever exposing the password.
        </p>
      </section>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-900">Try it yourself</p>
        <p className="mt-1 text-sm text-emerald-800">
          Paste any connection string into the parser — passwords stay masked and nothing leaves
          your browser.
        </p>
        <Link
          to="/tools/mongodb-uri-parser/"
          className="mt-3 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Try the MongoDB URI Parser
        </Link>
      </div>
    </article>
  );
}
