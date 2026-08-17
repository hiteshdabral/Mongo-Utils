/**
 * JSON → Mongoose schema generator (client-side, deterministic).
 *
 * Infers primitive types, arrays and nested objects from a JSON sample
 * document and emits a `mongoose.Schema` definition plus a model export.
 *
 * Accepts strict JSON as well as MongoDB shell / Extended JSON syntax
 * (unquoted keys, single quotes, ObjectId(...)/ISODate(...)/NumberInt(...)).
 */

export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}

export type PrimitiveName =
  | "String"
  | "Number"
  | "Boolean"
  | "Mixed"
  | "ObjectId"
  | "Date";

/**
 * Maps single-key MongoDB Extended JSON wrappers to their Mongoose types.
 */
const EXTENDED_JSON_PRIMITIVES: Record<string, PrimitiveName> = {
  $oid: "ObjectId",
  $date: "Date",
  $numberInt: "Number",
  $numberLong: "Number",
  $numberDecimal: "Number",
  $minKey: "Mixed",
  $maxKey: "Mixed",
  $binary: "Mixed",
  $timestamp: "Mixed",
  $regex: "Mixed",
  $dbRef: "Mixed",
};

export type SchemaNode =
  | { kind: "primitive"; name: PrimitiveName }
  | { kind: "array"; mode: "empty" }
  | { kind: "array"; mode: "mixed" }
  | { kind: "array"; mode: "single"; element: SchemaNode }
  | { kind: "object"; fields: SchemaField[] };

export interface SchemaField {
  key: string;
  type: SchemaNode;
}

function inferType(value: unknown): SchemaNode {
  if (value === null) return { kind: "primitive", name: "Mixed" };

  switch (typeof value) {
    case "string":
      return { kind: "primitive", name: "String" };
    case "number":
      return { kind: "primitive", name: "Number" };
    case "boolean":
      return { kind: "primitive", name: "Boolean" };
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return { kind: "array", mode: "empty" };
        const inferred = value.map(inferType);
        if (inferred.every((node) => sameType(node, inferred[0]))) {
          return { kind: "array", mode: "single", element: inferred[0] };
        }
        return { kind: "array", mode: "mixed" };
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record);
      if (keys.length === 1 && keys[0] in EXTENDED_JSON_PRIMITIVES) {
        return { kind: "primitive", name: EXTENDED_JSON_PRIMITIVES[keys[0]] };
      }
      if ("$regex" in record) {
        return { kind: "primitive", name: "Mixed" };
      }
      return {
        kind: "object",
        fields: Object.entries(record).map(([key, child]) => ({
          key,
          type: inferType(child),
        })),
      };
    }
    default:
      return { kind: "primitive", name: "Mixed" };
  }
}

function sameType(a: SchemaNode, b: SchemaNode): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "primitive" && b.kind === "primitive") return a.name === b.name;
  if (a.kind === "array" && b.kind === "array") {
    if (a.mode !== b.mode) return false;
    if (a.mode === "single" && b.mode === "single") return sameType(a.element, b.element);
    return true;
  }
  // Objects are considered compatible; the first shape wins.
  return true;
}

/**
 * Converts a user-provided model name into a safe PascalCase identifier.
 */
export function sanitizeModelName(input: string): string {
  const words = input.trim().split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  if (words.length === 0) return "Document";
  const joined = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
    .replace(/[^A-Za-z0-9_$]/g, "");
  const cleaned = joined === "" ? "Document" : joined;
  return /^[0-9]/.test(cleaned) ? `Model${cleaned}` : cleaned;
}

function renderKey(key: string): string {
  return /^[\p{L}$_][\p{L}\p{N}$_]*$/u.test(key) ? key : JSON.stringify(key);
}

function renderType(node: SchemaNode, level: number): string {
  const indent = "  ".repeat(level);
  switch (node.kind) {
    case "primitive": {
      switch (node.name) {
        case "Mixed":
          return "Schema.Types.Mixed";
        case "ObjectId":
          return "Schema.Types.ObjectId";
        default:
          return node.name;
      }
    }
    case "array":
      if (node.mode === "empty") return "[]";
      if (node.mode === "mixed") return "[Schema.Types.Mixed]";
      return `[${renderType(node.element, level)}]`;
    case "object": {
      if (node.fields.length === 0) return "Schema.Types.Mixed";
      const inner = node.fields
        .map((field) => `${indent}  ${renderKey(field.key)}: ${renderType(field.type, level + 1)}`)
        .join(",\n");
      return `new mongoose.Schema({\n${inner}\n${indent}})`;
    }
  }
}

export interface GenerateOptions {
  /** User-entered model name, e.g. "User" or "blog posts". */
  modelName: string;
}

/**
 * Normalizes MongoDB shell / Extended JSON syntax into strict JSON so
 * `JSON.parse` accepts it. Handles BSON helper wrappers, unquoted keys,
 * single-quoted strings/keys and trailing commas — e.g. output copied from
 * mongosh, the legacy mongo shell, or Studio 3T.
 */
function normalizeShellJson(text: string): string {
  let out = text;

  // DBRef must be replaced before ObjectId (it contains one).
  out = out.replace(
    /\bDBRef\s*\(\s*(['"])[^'"]*\1\s*,\s*ObjectId\s*\(\s*(['"])[^'"]*\2\s*\)\s*\)/g,
    '{"$dbRef": true}'
  );
  out = out.replace(/\bObjectI[Dd]\s*\(\s*(['"])([0-9a-fA-F]{24})\1\s*\)/g, '{"$oid":"$2"}');
  out = out.replace(/\bISODate\s*\(\s*(['"])([^'"]+)\1\s*\)/g, '{"$date":"$2"}');
  out = out.replace(/\bnew\s+Date\s*\(\s*(['"])([^'"]+)\1\s*\)/g, '{"$date":"$2"}');
  out = out.replace(/\bNumberInt\s*\(\s*(['"])(-?\d+)\1\s*\)/g, '{"$numberInt":"$2"}');
  out = out.replace(/\bNumberLong\s*\(\s*(['"])(-?\d+)\1\s*\)/g, '{"$numberLong":"$2"}');
  out = out.replace(
    /\bNumberDecimal\s*\(\s*(['"])(-?[\d]+(?:[.][\d]+)?(?:[eE][+-]?[\d]+)?)\1\s*\)/g,
    '{"$numberDecimal":"$2"}'
  );
  out = out.replace(/\bBinData\s*\(\s*\d+\s*,\s*(['"])[^'"]*\1\s*\)/g, '{"$binary":""}');
  out = out.replace(/\bUUID\s*\(\s*(['"])[^'"]*\1\s*\)/g, '{"$binary":"$1"}');
  out = out.replace(/\bTimestamp\s*\(\s*\d+\s*,\s*\d+\s*\)/g, '{"$timestamp": 1}');
  out = out.replace(/\bMinKey\s*\(\s*\)/g, '{"$minKey": 1}');
  out = out.replace(/\bMaxKey\s*\(\s*\)/g, '{"$maxKey": 1}');

  // Quote unquoted identifier keys: { key: value, ... }
  out = out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g, '$1"$2":');
  // Convert single-quoted strings and keys to double quotes.
  out = out.replace(/'([^'\\]*)'/g, '"$1"');
  // Remove trailing commas (common in shell/console output).
  out = out.replace(/,\s*([}\]])/g, '$1');

  return out;
}

/**
 * Generates Mongoose schema code from JSON text.
 * Throws SchemaError when the JSON cannot be parsed or no schema can be inferred.
 */
export function generateMongooseSchema(jsonText: string, options: GenerateOptions): string {
  const trimmed = jsonText.trim();
  if (trimmed === "") throw new SchemaError("Enter a JSON document to generate a schema from.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Not strict JSON — retry with MongoDB shell / Extended JSON syntax.
    try {
      parsed = JSON.parse(normalizeShellJson(trimmed));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      throw new SchemaError(`Invalid JSON: ${message}`);
    }
  }

  let document: unknown = parsed;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0 || typeof parsed[0] !== "object" || parsed[0] === null) {
      throw new SchemaError(
        "Unable to infer a schema from this JSON. Paste an object, or an array of objects."
      );
    }
    document = parsed[0];
  }
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    throw new SchemaError(
      "Unable to infer a schema from this JSON. Paste an object, or an array of objects."
    );
  }

  const modelName = sanitizeModelName(options.modelName);
  const root = inferType(document);
  const fields = root.kind === "object" ? root.fields : [];
  const fieldLines = fields
    .map((field) => `  ${renderKey(field.key)}: ${renderType(field.type, 1)}`)
    .join(",\n");

  return [
    `const ${modelName}Schema = new mongoose.Schema({`,
    fieldLines,
    `});`,
    "",
    `const ${modelName} = mongoose.model("${modelName}", ${modelName}Schema);`,
  ].join("\n");
}
