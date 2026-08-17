/**
 * Pretty-printer / minifier for parsed literal nodes. Deterministic output,
 * no evaluation of user code.
 */

import type { Node, ObjectEntry } from "./parser";

const INDENT_UNIT = "  ";
const INLINE_ARRAY_MAX = 72;

const KEYWORD_NAMES = new Set(["true", "false", "null", "undefined"]);

function isBareKey(key: string): boolean {
  return /^[\p{L}$_][\p{L}\p{N}$_]*$/u.test(key) && !KEYWORD_NAMES.has(key);
}

function renderKey(entry: ObjectEntry): string {
  if (!entry.quoted && isBareKey(entry.key)) return entry.key;
  return JSON.stringify(entry.key);
}

function renderStringValue(value: string, quote: string): string {
  const escaped = value.replace(/[\r\n\t]/g, (ch) => {
    if (ch === "\n") return "\\n";
    if (ch === "\t") return "\\t";
    return "\\r";
  });
  return quote + escaped + quote;
}

const INLINEABLE_KINDS = new Set(["string", "number", "keyword", "regex"]);

export function printNode(node: Node, level: number, minify: boolean): string {
  switch (node.kind) {
    case "object":
      return printObject(node, level, minify);
    case "array":
      return printArray(node, level, minify);
    case "string":
      return renderStringValue(node.value, node.quote);
    case "number":
      return node.raw;
    case "keyword":
      return node.value;
    case "regex":
      return `/${node.value}/${node.flags}`;
    case "raw":
      return node.text;
  }
}

function printObject(node: Extract<Node, { kind: "object" }>, level: number, minify: boolean): string {
  if (node.entries.length === 0) return "{}";
  if (minify) {
    const body = node.entries
      .map((entry) => `${renderKey(entry)}:${printNode(entry.value, level, true)}`)
      .join(",");
    return `{${body}}`;
  }
  const indent = INDENT_UNIT.repeat(level + 1);
  const closeIndent = INDENT_UNIT.repeat(level);
  const body = node.entries
    .map(
      (entry) =>
        `${indent}${renderKey(entry)}: ${printNode(entry.value, level + 1, false)}`
    )
    .join(",\n");
  return `{\n${body}\n${closeIndent}}`;
}

function printArray(node: Extract<Node, { kind: "array" }>, level: number, minify: boolean): string {
  if (node.items.length === 0) return "[]";

  const inline =
    minify ||
    (node.items.every((item) => INLINEABLE_KINDS.has(item.kind)) &&
      inlineLength(node, level) <= INLINE_ARRAY_MAX);

  if (inline) {
    const sep = minify ? "," : ", ";
    const body = node.items.map((item) => printNode(item, level, minify)).join(sep);
    return `[${body}]`;
  }

  const indent = INDENT_UNIT.repeat(level + 1);
  const closeIndent = INDENT_UNIT.repeat(level);
  const body = node.items
    .map((item) => `${indent}${printNode(item, level + 1, false)}`)
    .join(",\n");
  return `[\n${body}\n${closeIndent}]`;
}

function inlineLength(node: Extract<Node, { kind: "array" }>, level: number): number {
  return node.items.reduce((sum, item) => sum + printNode(item, level, true).length + 2, 0) + 2;
}
