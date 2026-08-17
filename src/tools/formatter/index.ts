/**
 * Safe JavaScript-like formatter for MongoDB shell queries and aggregation
 * pipelines.
 *
 * Strategy (never executes user input):
 * 1. Tokenize the whole input.
 * 2. Walk the token stream. Object/array literals that appear in value
 *    position are parsed and pretty-printed; everything else (method
 *    chains, function bodies, operators) is preserved verbatim as "raw"
 *    text with whitespace normalized.
 * 3. Assemble raw chunks and literals with deterministic newline rules.
 */

import { printNode } from "./printer";
import { parseLiteralAt, Node } from "./parser";
import { FormatSyntaxError, startsLiteral, Token, tokenize, tokenText } from "./tokenizer";

export type { Node } from "./parser";
export { FormatSyntaxError } from "./tokenizer";

type Item = { kind: "raw"; text: string } | { kind: "literal"; node: Node };

export interface FormatResult {
  output: string;
  /** Number of object/array literals that were reformatted. */
  literalCount: number;
}

/** True when the next token should attach directly after a literal (no newline). */
function attachesAfterLiteral(text: string): boolean {
  return /^[)\].,;]/.test(text);
}

/** True when a literal should attach directly after raw text. */
function attachesBeforeLiteral(rawText: string): boolean {
  return /[(,[=]$/.test(rawText);
}

function joinRawTokens(tokens: Token[], minify: boolean): string {
  let out = "";
  let prev: Token | undefined;
  for (const token of tokens) {
    if (prev && needsSpace(prev, token, minify)) out += " ";
    out += tokenText(token);
    prev = token;
  }
  return out;
}

function needsSpace(prev: Token, next: Token, minify: boolean): boolean {
  if (minify) return false;
  const p = prev.value;
  const n = next.value;
  if (p === "." || n === ".") return false;
  if (n === ")" || n === "]" || n === "," || n === ";") return false;
  if (p === "(" || p === "[") return false;
  if (n === "(" || n === "[") return false;
  return true;
}

/**
 * Formats JavaScript-like MongoDB syntax.
 * Throws FormatSyntaxError when a literal is malformed.
 */
export function formatJsLike(input: string, opts: { minify?: boolean } = {}): FormatResult {
  const minify = opts.minify ?? false;
  const tokens = tokenize(input);

  const items: Item[] = [];
  const rawParts: Token[] = [];
  let literalCount = 0;
  let prevSignificant: Token | undefined;

  const flushRaw = () => {
    if (rawParts.length > 0) {
      items.push({ kind: "raw", text: joinRawTokens(rawParts, minify) });
      rawParts.length = 0;
    }
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    const isOpenBrace = token.type === "punct" && (token.value === "{" || token.value === "[");
    if (isOpenBrace && startsLiteral(prevSignificant)) {
      flushRaw();
      const { node, next } = parseLiteralAt(tokens, i);
      items.push({ kind: "literal", node });
      literalCount++;
      prevSignificant = tokens[next - 1];
      i = next;
      continue;
    }
    rawParts.push(token);
    prevSignificant = token;
    i++;
  }
  flushRaw();

  // Assemble
  let out = "";
  let prevItem: Item | undefined;
  for (const item of items) {
    if (item.kind === "literal") {
      const rendered = printNode(item.node, 0, minify);
      if (out === "" || prevItem === undefined) {
        out = rendered;
      } else if (prevItem.kind === "raw" && attachesBeforeLiteral(prevItem.text)) {
        const gap =
          !minify && (prevItem.text.endsWith(",") || prevItem.text.endsWith("=")) ? " " : "";
        out += gap + rendered;
      } else {
        out += "\n" + rendered;
      }
    } else {
      const text = item.text.trim();
      if (text === "") {
        prevItem = item;
        continue;
      }
      if (out === "" || prevItem === undefined) {
        out = text;
      } else if (prevItem.kind === "literal" && attachesAfterLiteral(text)) {
        out += text;
      } else {
        out += "\n" + text;
      }
    }
    prevItem = item;
  }

  return { output: out.trim(), literalCount };
}

/** Formats a MongoDB shell query / JavaScript-like snippet. */
export function formatQuery(input: string): FormatResult {
  return formatJsLike(input, { minify: false });
}

/** Minifies a MongoDB shell query / JavaScript-like snippet onto one line. */
export function minifyQuery(input: string): FormatResult {
  return formatJsLike(input, { minify: true });
}

/** Validates input and returns either an error message or null. */
export function validateJsLike(input: string): string | null {
  try {
    formatJsLike(input);
    return null;
  } catch (error) {
    if (error instanceof FormatSyntaxError) return error.message;
    return error instanceof Error ? error.message : "Unknown validation error.";
  }
}
