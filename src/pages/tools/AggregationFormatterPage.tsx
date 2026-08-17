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
import { formatQuery, minifyQuery, validateJsLike } from "../../tools/formatter";
import { extractStages } from "../../tools/formatter/stages";

const EXAMPLES = [
  {
    name: "Match, group, sort",
    value: '[{$match:{status:"active"}},{$group:{_id:"$department",count:{$sum:1}}},{$sort:{count:-1}}]',
  },
  {
    name: "Lookup join",
    value: '[{$lookup:{from:"orders",localField:"_id",foreignField:"userId",as:"orders"}},{$unwind:"$orders"}]',
  },
  {
    name: "Project and limit",
    value: '[{$project:{name:1,email:1,total:{$multiply:["$price","$qty"]}}},{$limit:10}]',
  },
  {
    name: "Facet bucketing",
    value: '[{$facet:{byDept:[{$group:{_id:"$dept",n:{$sum:1}}}],byStatus:[{$group:{_id:"$status",n:{$sum:1}}}]}}]',
  },
];

export default function AggregationFormatterPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"format" | "minify">("format");

  const stages = useMemo(() => extractStages(output), [output]);
  const looksLikePipeline = useMemo(
    () => input.trim().startsWith("["),
    [input]
  );

  const run = (raw: string, nextMode: "format" | "minify") => {
    if (raw.trim() === "") {
      setOutput("");
      setError("Enter an aggregation pipeline to format.");
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
    ["mongodb-query-formatter", "mongodb-objectid-timestamp", "json-to-mongoose"].includes(tool.slug)
  );

  return (
    <ToolLayout
      title="MongoDB Aggregation Formatter"
      description="Format or minify MongoDB aggregation pipelines, list every stage, and jump to the official documentation for each operator."
      howItWorks={[
        {
          title: "Pipeline-aware formatting",
          body: "Paste an array of pipeline stages and the formatter re-indents every stage object, including nested operators like $group, $lookup and $facet.",
        },
        {
          title: "Stage list",
          body: "After formatting, every stage is detected and listed in order. Each stage links to its entry in the official MongoDB aggregation reference.",
        },
        {
          title: "Validation",
          body: "Malformed pipelines (unclosed brackets, missing values) produce a clear error with the position of the problem.",
        },
      ]}
      commonUses={[
        "Formatting pipelines copied from code, logs, or Compass.",
        "Minifying pipelines for embedding in code or configs.",
        "Quickly reviewing which stages a pipeline runs and in what order.",
        "Jumping to operator documentation while debugging.",
      ]}
      faqs={[
        {
          question: "Does this validate my pipeline against MongoDB semantics?",
          answer:
            "It validates JavaScript-like syntax, not semantics. A structurally valid pipeline with an unknown operator will still format.",
        },
        {
          question: "Is the pipeline sent to a server?",
          answer: "No. Everything is processed locally in your browser.",
        },
        {
          question: "Which stages are recognized in the stage list?",
          answer:
            "Common stages such as $match, $group, $project, $lookup, $unwind, $sort, $limit, $skip, $set, $addFields, $replaceRoot and $facet, with links for the full reference.",
        },
      ]}
      relatedTools={related}
    >
      <Seo
        title="MongoDB Aggregation Formatter — Format Pipelines Online"
        description="Format and minify MongoDB aggregation pipelines, see the stage list and open official docs for every operator. 100% client-side."
        path="/tools/mongodb-aggregation-formatter/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "MongoDB Aggregation Formatter",
          description: "Format and minify MongoDB aggregation pipelines locally in the browser.",
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
          <span className="text-xs text-slate-500">Pipelines never leave your browser</span>
        </div>
        <InputEditor
          label="Aggregation pipeline"
          value={input}
          onChange={setInput}
          onRun={() => run(input, mode)}
          placeholder='[{ $match: { status: "active" } }, { $group: { _id: "$department" } }]'
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

      {output !== "" && stages.length > 0 && (
        <section aria-labelledby="stage-list" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 id="stage-list" className="text-sm font-bold text-slate-900">
            Pipeline stages ({stages.length})
          </h2>
          <ol className="mt-3 flex flex-wrap gap-2">
            {stages.map((stage) => (
              <li key={`${stage.index}-${stage.name}`}>
                <a
                  href={stage.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-800 ring-1 ring-inset ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-800 hover:ring-emerald-300"
                >
                  <span className="text-slate-400">{stage.index}.</span>
                  {stage.name}
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {output !== "" && stages.length === 0 && looksLikePipeline && (
        <p className="text-sm text-slate-500">
          No stages detected. Paste an array of stage objects like{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">{'[{ $match: {} }]'}</code>{" "}
          to see the stage list.
        </p>
      )}

      <OutputArea
        label="Formatted pipeline"
        value={output}
        downloadName={mode === "minify" ? "pipeline.min.js" : "pipeline.js"}
      />
    </ToolLayout>
  );
}
