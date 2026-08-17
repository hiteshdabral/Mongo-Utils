import Seo from "../components/Seo";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Seo
        title="Terms of Use — MongoDB Tools"
        description="Terms of use for MongoDB Tools: the free client-side utilities are provided as-is without warranty."
        path="/terms/"
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Terms of Use</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-7 text-slate-700">
        <p>
          By using this site you agree to these terms. If you do not agree, do not use the site.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Free use</h2>
        <p>
          The tools are provided free of charge for personal and professional use. No account is
          required.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Your responsibility</h2>
        <p>
          You are responsible for the data you process and for compliance with laws that apply to
          you. Do not process data you are not authorized to handle. Verify tool output before
          using it in production systems.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">No warranty</h2>
        <p>
          The site and its tools are provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind, express or implied, including merchantability, fitness
          for a particular purpose, or non-infringement. We do not warrant that the tools are
          error-free or suitable for your specific needs.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental,
          special, or consequential damages arising from your use of the site, including lost
          profits or data.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Intellectual property</h2>
        <p>
          MongoDB Tools is an independent project and is not affiliated with or endorsed by
          MongoDB, Inc. MongoDB&reg; is a registered trademark of MongoDB, Inc. Trademark uses are
          nominative and do not imply endorsement.
        </p>
        <h2 className="pt-2 text-xl font-bold text-slate-900">Changes</h2>
        <p>These terms may be updated from time to time. Continued use means acceptance.</p>
      </div>
    </div>
  );
}
