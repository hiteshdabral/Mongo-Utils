import { useState } from "react";
import Button from "../../components/Button";
import ClearButton from "../../components/ClearButton";
import ErrorMessage from "../../components/ErrorMessage";
import ExampleSelector from "../../components/ExampleSelector";
import InputEditor from "../../components/InputEditor";
import OutputArea from "../../components/OutputArea";
import Seo from "../../components/Seo";
import ToolLayout from "../../components/ToolLayout";
import { TOOLS } from "../../data/toolRegistry";
import { formatQuery, minifyQuery, validateJsLike } from "../../tools/formatter";

const EXAMPLES = [
  {
    name: "find with operators",
    value: 'db.users.find({age:{$gte:18},status:"active"}).sort({createdAt:-1})',
  },
  {
    name: "update with $set",
    value: 'db.orders.updateOne({_id: ObjectId("507f1f77bcf86cd799439011")}, {$set:{status:"shipped",updatedAt:Date.now()}})',
  },
  {
    name: "complex query",
    value: 'db.products.find({$or:[{price:{$lt:10}},{stock:{$gt:100}}],tags:{$in:["sale","new"]}})',
  },
  {
    name: "regex and null",
    value: 'db.logs.find({level:{$in:["error","warn"]},message:{$regex:/^timeout/},deleted:null})',
  },
];

export default function QueryFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");

  const run = (raw: string, nextMode: "format" | "minify") => {
    if (raw.trim() === "") {
      setOutput("");
      setError("Enter a MongoDB query to format.");
      return;
    }
    const validation = validateJsLike(raw);
    if (validation !== null) {
      setOutput("");
      setError(validation);
      return;
    }
    const result = nextMode === "format" ? formatQuery(raw) : minifyQuery(raw);
    setOutput(result.output);
    setError("");
    setMode(nextMode);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const related = TOOLS.filter((tool) =>
    ["mongodb-aggregation-formatter", "mongodb-uri-parser", "json-to-mongoose"].includes(tool.slug)
  );

  return (
    <ToolLayout
      title="MongoDB Query Formatter"
      description="Format or minify MongoDB shell queries like db.users.find({...}). Preserves the wrapper syntax while making object literals readable."
      howItWorks={[
        {
          title: "Safe, deterministic formatting",
          body: "The formatter tokenizes your input and reformats object and array literals without ever executing your code. The shell wrapper (db.collection.method(...)), method chains, and expressions like ObjectId(...) or Date.now() are preserved as-is.",
        },
        {
          title: "Honest scope",
          body: "This is not a full JavaScript parser. Common MongoDB query syntax is supported; exotic shell statements may be returned as-is or flagged with a validation error rather than silently reformatted incorrectly.",
        },
        {
          title: "Minify mode",
          body: "Minify collapses the query to a single line by removing optional whitespace, which is handy for logs, tickets, or compact snippets.",
        },
      ]}
      commonUses={[
        "Making pasted queries readable before sharing or reviewing.",
        "Formatting queries from logs or error messages.",
        "Minifying queries for documentation or command line use.",
        "Catching missing braces or colons in handwritten queries.",
      ]}
      faqs={[
        {
          question: "Does this execute my query?",
          answer:
            "Never. The formatter only reads the syntax and rewrites whitespace. No JavaScript evaluation happens at any point.",
        },
        {
          question: "Does it support every MongoDB shell feature?",
          answer:
            "Common query shapes are covered, and the shell wrapper is preserved. Some rare syntax is kept verbatim or reported as a validation error.",
        },
        {
          question: "Are strings and operators preserved exactly?",
          answer:
            "Yes. Quotes, escapes, regex literals, and $ operators keep their original meaning.",
        },
      ]}
      relatedTools={related}
    >
      <Seo
        title="MongoDB Query Formatter — Format & Minify db.collection.find()"
        description="Format or minify MongoDB shell queries. Safe client-side formatter that never executes your code, with clear validation errors."
        path="/tools/mongodb-query-formatter/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "MongoDB Query Formatter",
          description: "Format and minify MongoDB shell queries locally in the browser.",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          browserRequirements: "Requires JavaScript",
          offers: { "@type": "Offer", price: "0" },
        }}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <ExampleSelector
            label="Examples"
            examples={EXAMPLES}
            onSelect={(value) => {
              setInput(value);
              run(value, "format");
            }}
          />
          <span className="text-xs text-slate-500">Queries never leave your browser</span>
        </div>
        <InputEditor
          label="MongoDB shell query"
          value={input}
          onChange={setInput}
          onRun={() => run(input, mode)}
          placeholder='db.users.find({age: {$gte: 18}})'
          autoFocus
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => run(input, "format")}>Format</Button>
          <Button variant="secondary" onClick={() => run(input, "minify")}>
            Minify
          </Button>
          <ClearButton onClick={handleClear} disabled={input === "" && output === ""} />
        </div>
        {error !== "" && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </div>

      <OutputArea
        label="Formatted query"
        value={output}
        downloadName={mode === "minify" ? "query.min.js" : "query.js"}
      />
    </ToolLayout>
  );
}
