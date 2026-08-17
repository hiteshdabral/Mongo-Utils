import Seo from "../components/Seo";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Seo
        title="Privacy Policy — MongoDB Tools"
        description="MongoDB Tools processes your data locally in your browser. Connection strings, queries and documents are never uploaded, logged, or shared."
        path="/privacy/"
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-700">
        <p>Privacy is a core feature of this product, not an afterthought.</p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Data processing</h2>
        <p>
          All tools run entirely in your browser. The data you paste — connection strings,
          passwords, ObjectIds, queries, aggregation pipelines, and JSON documents — is processed
          locally on your device and is <strong>not uploaded to our servers</strong>.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">What we do not collect</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>MongoDB connection strings or credentials</li>
          <li>Queries, pipelines, or documents you paste</li>
          <li>JWTs, API keys, or other secrets</li>
        </ul>
        <p>
          Sensitive input is never logged, never placed in URLs, and never included in analytics
          events.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Analytics</h2>
        <p>
          The current version ships without analytics. If aggregate product analytics are added in
          the future (e.g. which tools are opened, copy clicks), they will contain product-level
          events only and will never include values you type or paste.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Cookies and storage</h2>
        <p>This site does not set cookies and does not store your input in browser storage.</p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Third-party services</h2>
        <p>
          The current version does not load third-party scripts. Tool pages may link to the
          official MongoDB documentation, which is governed by its own privacy policy.
        </p>
      </div>
    </div>
  );
}
