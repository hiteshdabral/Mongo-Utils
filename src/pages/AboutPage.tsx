import Seo from "../components/Seo";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Seo
        title="About MongoDB Tools"
        description="MongoDB Tools is a focused collection of free, client-side utilities for MongoDB developers, backend engineers, and DevOps teams."
        path="/about/"
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">About</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-700">
        <p>
          <strong>MongoDB Tools</strong> is a focused collection of utilities for MongoDB
          developers, backend engineers, and DevOps teams. Instead of a hundred generic developer
          tools, this site offers a small set of reliable tools around one workflow: working with
          MongoDB.
        </p>
        <p>Every tool follows four principles:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Client-side first</strong> — when no backend is needed, everything runs in
            your browser.
          </li>
          <li>
            <strong>Never expose secrets</strong> — connection strings, queries, and documents are
            never uploaded, logged, or shared.
          </li>
          <li>
            <strong>Composable</strong> — tools link naturally: parse a URI, format a query, format
            a pipeline, generate a schema.
          </li>
          <li>
            <strong>Simple UI</strong> — each tool answers what it does, what to paste, and what
            you get back.
          </li>
        </ul>
        <p>
          The site is a static web application with no accounts and no database. New tools are
          added based on real developer needs and actual usage.
        </p>
      </div>
    </div>
  );
}
