import { useMemo, useState } from "react";
import Button from "../../components/Button";
import ClearButton from "../../components/ClearButton";
import ErrorMessage from "../../components/ErrorMessage";
import ExampleSelector from "../../components/ExampleSelector";
import InputEditor from "../../components/InputEditor";
import OutputArea from "../../components/OutputArea";
import Seo from "../../components/Seo";
import ToolLayout from "../../components/ToolLayout";
import { TOOLS } from "../../data/toolRegistry";
import { formatUriSummary, parseMongoUri } from "../../tools/uri-parser/parseMongoUri";

const EXAMPLES = [
  {
    name: "Local with credentials",
    value: "mongodb://username:password@localhost:27017/mydb",
  },
  {
    name: "Atlas SRV with encoded password",
    value: "mongodb+srv://dev:p%40ss%3Aword@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority",
  },
  {
    name: "Replica set",
    value: "mongodb://host1:27017,host2:27018/mydb?replicaSet=rs0&authSource=admin",
  },
  {
    name: "TLS and options",
    value: "mongodb://localhost:27017/mydb?tls=true&authMechanism=SCRAM-SHA-256&maxPoolSize=10",
  },
];

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-words font-mono text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default function UriParserPage() {
  const [uri, setUri] = useState("");
  const [reveal, setReveal] = useState(false);

  const parsed = useMemo(() => {
    if (uri.trim() === "") return null;
    try {
      return { ok: true as const, value: parseMongoUri(uri) };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : "Invalid URI." };
    }
  }, [uri]);

  const summary = parsed?.ok ? formatUriSummary(parsed.value, reveal) : "";
  const hasInput = uri.trim() !== "";

  const related = TOOLS.filter((tool) =>
    ["mongodb-query-formatter", "mongodb-objectid-timestamp", "json-to-mongoose"].includes(tool.slug)
  );

  return (
    <ToolLayout
      title="MongoDB URI Parser"
      description="Parse a MongoDB connection string into its parts: protocol, hosts, port, database, credentials and options. Supports mongodb:// and mongodb+srv://."
      howItWorks={[
        {
          title: "Local parsing only",
          body: "The connection string is parsed in your browser using the standard MongoDB URI format. It is never transmitted, stored, or logged. Passwords are masked by default and can be revealed with the toggle.",
        },
        {
          title: "Supported syntax",
          body: "Both mongodb:// and mongodb+srv:// schemes, percent-encoded credentials, multiple hosts, IPv6 addresses, query parameters, replica-set options, and authentication options such as authSource and authMechanism.",
        },
        {
          title: "Warnings",
          body: "Common mistakes are called out, such as ports in SRV URIs, unknown options, or passwords without usernames.",
        },
      ]}
      commonUses={[
        "Understanding what each part of a connection string does.",
        "Checking credentials, database, and options before troubleshooting.",
        "Verifying Atlas SRV strings without exposing the password.",
        "Documenting or teaching the MongoDB URI format.",
      ]}
      faqs={[
        {
          question: "Is my password safe?",
          answer:
            "Yes. The URI never leaves your browser, and the password is masked in the output and in the copied summary. You can reveal it locally with the toggle.",
        },
        {
          question: "What is the difference between mongodb:// and mongodb+srv://?",
          answer:
            "mongodb+srv:// (SRV) looks up hostnames via DNS, which is what MongoDB Atlas uses. SRV URIs take a single hostname without a port.",
        },
        {
          question: "Why does the parsed port show 27017 when my URI has no port?",
          answer: "27017 is MongoDB's default port, so it is shown as the effective port.",
        },
      ]}
      relatedTools={related}
    >
      <Seo
        title="MongoDB URI Parser — Parse Connection Strings Securely"
        description="Parse mongodb:// and mongodb+srv:// connection strings into hosts, database, credentials and options. 100% client-side with masked passwords."
        path="/tools/mongodb-uri-parser/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "MongoDB URI Parser",
          description:
            "Parse MongoDB connection strings locally in the browser with masked passwords.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0" },
        }}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <ExampleSelector label="Examples" examples={EXAMPLES} onSelect={setUri} />
          <span className="text-xs text-slate-500">Passwords are masked by default</span>
        </div>
        <InputEditor
          label="MongoDB connection string"
          value={uri}
          onChange={setUri}
          rows={3}
          placeholder="mongodb://username:password@localhost:27017/mydb"
          autoFocus
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ClearButton onClick={() => setUri("")} disabled={!hasInput} />
        </div>
      </div>

      {parsed && !parsed.ok && (
        <ErrorMessage message={parsed.message} />
      )}

      {parsed?.ok && (
        <>
          <dl className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FieldRow label="Protocol">{parsed.value.protocol}</FieldRow>
            <FieldRow label="Host(s)">
              {parsed.value.hosts
                .map((h) => (h.port === null ? h.host : `${h.host}:${h.port}`))
                .join(", ")}
            </FieldRow>
            <FieldRow label="Port">
              {parsed.value.port === null
                ? `${parsed.value.effectivePort} (default)`
                : parsed.value.port}
            </FieldRow>
            <FieldRow label="Database">{parsed.value.database ?? "—"}</FieldRow>
            <FieldRow label="Username">{parsed.value.username ?? "—"}</FieldRow>
            <FieldRow label="Password">
              {parsed.value.password === null ? (
                "—"
              ) : reveal ? (
                parsed.value.password
              ) : (
                <span aria-label="Password masked">••••••••••</span>
              )}
            </FieldRow>
            <FieldRow label="Auth options">
              {parsed.value.authOptions.length === 0
                ? "—"
                : parsed.value.authOptions
                    .map((o) => (o.value === "" ? o.key : `${o.key} = ${o.value}`))
                    .join(", ")}
            </FieldRow>
            <FieldRow label="Replica set">
              {parsed.value.replicaSetOptions.length === 0
                ? "—"
                : parsed.value.replicaSetOptions
                    .map((o) => (o.value === "" ? o.key : `${o.key} = ${o.value}`))
                    .join(", ")}
            </FieldRow>
            <FieldRow label="Connection options">
              {parsed.value.connectionOptions.length === 0
                ? "—"
                : parsed.value.connectionOptions
                    .map((o) => (o.value === "" ? o.key : `${o.key} = ${o.value}`))
                    .join(", ")}
            </FieldRow>
            <FieldRow label="Other parameters">
              {parsed.value.otherOptions.length === 0
                ? "—"
                : parsed.value.otherOptions
                    .map((o) => (o.value === "" ? o.key : `${o.key} = ${o.value}`))
                    .join(", ")}
            </FieldRow>
          </dl>

          {parsed.value.password !== null && (
            <Button variant="secondary" onClick={() => setReveal((value) => !value)}>
              {reveal ? "Hide password" : "Reveal password"}
            </Button>
          )}

          {parsed.value.warnings.length > 0 && (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <ul className="list-disc space-y-1 pl-5">
                {parsed.value.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <OutputArea
            label="Text summary (password masked)"
            value={summary}
            downloadName="mongodb-uri-summary.txt"
          />
        </>
      )}
    </ToolLayout>
  );
}
