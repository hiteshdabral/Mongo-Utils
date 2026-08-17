import { Link } from "react-router-dom";
import Seo from "../../components/Seo";

export default function ObjectIdGuide() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <Seo
        title="How MongoDB ObjectId Works — Structure and Timestamp"
        description="Learn how a MongoDB ObjectId is built from a 4-byte timestamp, 5 random bytes and a 3-byte counter, and how to extract the creation time."
        path="/guides/how-mongodb-objectid-works/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: "How MongoDB ObjectId Works",
          about: "MongoDB ObjectId structure and timestamp extraction",
        }}
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        How MongoDB ObjectId works
      </h1>
      <p className="mt-3 text-slate-500">
        A practical explanation of the 12 bytes behind every document&apos;s <code>_id</code>.
      </p>

      <section className="mt-8 space-y-4 text-[15px] leading-7 text-slate-700">
        <p>
          When a MongoDB document is created without an explicit <code>_id</code>, drivers
          generate an <strong>ObjectId</strong> — a 12-byte value usually displayed as 24
          hexadecimal characters, like <code className="break-all">507f1f77bcf86cd799439011</code>.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">The 12-byte layout</h2>
        <p>The 24 hex characters are four groups of bytes:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Bytes 0–3 (8 hex chars):</strong> a Unix timestamp in seconds — the moment the
            ObjectId was created.
          </li>
          <li>
            <strong>Bytes 4–8 (10 hex chars):</strong> a random value unique to the machine and
            process.
          </li>
          <li>
            <strong>Bytes 9–11 (6 hex chars):</strong> a counter that starts at a random value and
            increments for every ObjectId generated in the same second.
          </li>
        </ul>
        <p>
          The first group is why ObjectIds are roughly sortable by creation time — and why you can
          recover an approximate creation date from an ObjectId alone.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">
          Getting the creation time from an ObjectId
        </h2>
        <p>
          Take the first 8 hex characters, convert them from base 16 to a number, and interpret the
          result as Unix seconds. For <code>507f1f77…</code> the timestamp is{" "}
          <code>0x507f1f77</code> seconds. The precision is one second, not milliseconds.
        </p>
        <p>
          You can do this by hand, but the fastest way is a converter — paste the ObjectId and get
          the UTC and local dates instantly.
        </p>
      </section>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-semibold text-emerald-900">Try it yourself</p>
        <p className="mt-1 text-sm text-emerald-800">
          Paste any ObjectId into the converter to see its creation timestamp, UTC date and local
          date.
        </p>
        <Link
          to="/tools/mongodb-objectid-timestamp/"
          className="mt-3 inline-block rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Try ObjectId Timestamp Converter
        </Link>
      </div>
    </article>
  );
}
