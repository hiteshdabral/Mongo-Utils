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
import { generateMongooseSchema } from "../../tools/mongoose-generator/inferSchema";

const EXAMPLES = [
  {
    name: "Simple user",
    value: JSON.stringify(
      { name: "John", age: 25, active: true, tags: ["node", "mongodb"] },
      null,
      2
    ),
  },
  {
    name: "Nested document",
    value: JSON.stringify(
      {
        name: "Order 123",
        total: 49.9,
        address: { city: "Berlin", zip: 10115 },
        items: [{ sku: "a1", qty: 2 }],
      },
      null,
      2
    ),
  },
  {
    name: "Mixed and nulls",
    value: JSON.stringify({ meta: null, flags: [], values: [1, "two", false] }, null, 2),
  },
  {
    name: "Array of documents",
    value: JSON.stringify([{ title: "A", views: 10 }, { title: "B" }], null, 2),
  },
];

export default function JsonToMongoosePage() {
  const [input, setInput] = useState("");
  const [modelName, setModelName] = useState("User");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const run = (raw: string, name: string) => {
    if (raw.trim() === "") {
      setOutput("");
      setError("Enter a JSON document to generate a schema from.");
      return;
    }
    try {
      setOutput(generateMongooseSchema(raw, { modelName: name }));
      setError("");
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : "Could not generate a schema.");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const related = TOOLS.filter((tool) =>
    ["mongodb-query-formatter", "mongodb-aggregation-formatter", "mongodb-uri-parser"].includes(
      tool.slug
    )
  );

  return (
    <ToolLayout
      title="JSON to Mongoose Schema"
      description="Generate a Mongoose schema from JSON or MongoDB shell output (ObjectId(...), ISODate(...), NumberInt(...)). Primitive types, arrays, nested objects, nulls and mixed values are inferred automatically."
      howItWorks={[
        {
          title: "Type inference",
          body: "Strings become String, numbers become Number, booleans become Boolean. Arrays become typed arrays ([String], [Number], …) and nested objects become sub-schemas with new mongoose.Schema({...}).",
        },
        {
          title: "Edge cases",
          body: "null values and empty objects become Schema.Types.Mixed. Empty arrays become [], and arrays with mixed value types become [Schema.Types.Mixed]. Arrays of documents use the first element's shape. Extended JSON wrappers map to native types: $oid → Schema.Types.ObjectId, $date → Date, $numberInt/$numberLong/$numberDecimal → Number.",
        },
        {
          title: "Model name",
          body: "The model name is sanitized into a PascalCase identifier and used for both the schema constant and the mongoose.model(...) export.",
        },
      ]}
      commonUses={[
        "Bootstrapping schemas from API responses or sample documents.",
        "Prototyping before refining types manually.",
        "Teaching Mongoose schema syntax.",
        "Quickly modeling third-party JSON payloads.",
      ]}
      faqs={[
        {
          question: "Does this cover every Mongoose feature?",
          answer:
            "No — it infers common shapes from your data. Required flags, indexes, defaults, refs, and validators should be added manually.",
        },
        {
          question: "What happens with null or missing fields?",
          answer:
            "null values are treated as Schema.Types.Mixed. Missing fields simply produce no key; paste documents with all representative fields for the best result.",
        },
        {
          question: "Can I paste mongosh / MongoDB shell output?",
          answer:
            "Yes. Unquoted keys, single quotes and BSON wrappers such as ObjectId(...), ISODate(...) and NumberInt(...) are normalized automatically before type inference.",
        },
        {
          question: "Is my JSON uploaded anywhere?",
          answer: "No. Generation happens entirely in your browser.",
        },
      ]}
      relatedTools={related}
    >
      <Seo
        title="JSON to Mongoose Schema Generator — Free Tool"
        description="Generate a Mongoose schema from JSON. Infers String, Number, Boolean, arrays and nested objects. 100% client-side and free."
        path="/tools/json-to-mongoose/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "JSON to Mongoose Schema Generator",
          description: "Generate Mongoose schemas from JSON documents locally in the browser.",
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
              run(value, modelName);
            }}
          />
          <span className="text-xs text-slate-500">JSON never leaves your browser</span>
        </div>
        <InputEditor
          label="JSON document"
          value={input}
          onChange={setInput}
          onRun={() => run(input, modelName)}
          placeholder='{ "name": "John", "age": 25 }'
          autoFocus
        />
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label
              htmlFor="model-name"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Model name
            </label>
            <input
              id="model-name"
              type="text"
              value={modelName}
              onChange={(event) => setModelName(event.target.value)}
              placeholder="User"
              className="w-44 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>
          <Button onClick={() => run(input, modelName)}>Generate schema</Button>
          <ClearButton onClick={handleClear} disabled={input === "" && output === ""} />
        </div>
        {error !== "" && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </div>

      <OutputArea
        label="Mongoose schema"
        value={output}
        downloadName="schema.js"
      />
    </ToolLayout>
  );
}
