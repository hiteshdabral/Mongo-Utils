/**
 * A small recursive-descent parser for object and array literals inside
 * JavaScript-like MongoDB syntax. It never evaluates anything.
 */

import { FormatSyntaxError, Token, tokenText } from "./tokenizer";

export type Quote = '"' | "'";

export interface ObjectEntry {
  key: string;
  quoted: boolean;
  value: Node;
}

export type Node =
  | { kind: "object"; entries: ObjectEntry[] }
  | { kind: "array"; items: Node[] }
  | { kind: "string"; value: string; quote: Quote }
  | { kind: "number"; raw: string }
  | { kind: "keyword"; value: string }
  | { kind: "regex"; value: string; flags: string }
  | { kind: "raw"; text: string };

const KEYWORDS = new Set(["true", "false", "null", "undefined"]);

/**
 * Parses an object or array literal starting at `tokens[start]`
 * (which must be `{` or `[`). Returns the node and the index just past it.
 */
export function parseLiteralAt(tokens: Token[], start: number): { node: Node; next: number } {
  const token = tokens[start];
  if (!token) throw new FormatSyntaxError("Unexpected end of input", tokens.length);
  if (token.type === "punct" && token.value === "{") return parseObject(tokens, start);
  if (token.type === "punct" && token.value === "[") return parseArray(tokens, start);
  throw new FormatSyntaxError(`Expected "{" or "[", found "${token.value}"`, token.pos);
}

function parseObject(tokens: Token[], start: number): { node: Node; next: number } {
  const entries: ObjectEntry[] = [];
  let i = start + 1;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === "punct" && token.value === "}") {
      return { node: { kind: "object", entries }, next: i + 1 };
    }
    if (token.type === "punct" && token.value === ",") {
      // Trailing comma (valid in modern JavaScript).
      i++;
      if (tokens[i]?.type === "punct" && tokens[i].value === "}") {
        return { node: { kind: "object", entries }, next: i + 1 };
      }
      continue;
    }

    // Key: identifier, string or number.
    let key: string;
    let quoted: boolean;
    if (token.type === "identifier") {
      key = token.value;
      quoted = false;
    } else if (token.type === "string") {
      key = token.value;
      quoted = true;
    } else if (token.type === "number") {
      key = token.value;
      quoted = true;
    } else {
      throw new FormatSyntaxError(
        `Expected an object key, found "${token.value}"`,
        token.pos
      );
    }
    i++;

    const colon = tokens[i];
    if (!colon || colon.type !== "punct" || colon.value !== ":") {
      throw new FormatSyntaxError(`Expected ":" after key "${key}"`, token.pos);
    }
    i++;

    const value = parseValue(tokens, i);
    i = value.next;
    entries.push({ key, quoted, value: value.node });

    const sep = tokens[i];
    if (sep && sep.type === "punct" && sep.value === ",") {
      i++;
      continue;
    }
    if (sep && sep.type === "punct" && sep.value === "}") {
      return { node: { kind: "object", entries }, next: i + 1 };
    }
    throw new FormatSyntaxError(
      sep
        ? `Expected "," or "}", found "${sep.value}"`
        : "Unexpected end of input: expected \",\" or \"}\"",
      sep ? sep.pos : tokens.length
    );
  }

  throw new FormatSyntaxError("Unterminated object: missing \"}\"", tokens[start].pos);
}

function parseArray(tokens: Token[], start: number): { node: Node; next: number } {
  const items: Node[] = [];
  let i = start + 1;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === "punct" && token.value === "]") {
      return { node: { kind: "array", items }, next: i + 1 };
    }
    if (token.type === "punct" && token.value === ",") {
      i++;
      continue;
    }
    const value = parseValue(tokens, i);
    i = value.next;
    items.push(value.node);

    const sep = tokens[i];
    if (sep && sep.type === "punct" && sep.value === ",") {
      i++;
      continue;
    }
    if (sep && sep.type === "punct" && sep.value === "]") {
      return { node: { kind: "array", items }, next: i + 1 };
    }
    throw new FormatSyntaxError(
      sep
        ? `Expected "," or "]", found "${sep.value}"`
        : "Unexpected end of input: expected \",\" or \"]\"",
      sep ? sep.pos : tokens.length
    );
  }

  throw new FormatSyntaxError("Unterminated array: missing \"]\"", tokens[start].pos);
}

function parseValue(tokens: Token[], start: number): { node: Node; next: number } {
  const token = tokens[start];
  if (!token) {
    throw new FormatSyntaxError("Unexpected end of input while reading a value", tokens.length);
  }

  switch (token.type) {
    case "string":
      return { node: { kind: "string", value: token.value, quote: token.quote ?? '"' }, next: start + 1 };
    case "number":
      return { node: { kind: "number", raw: token.value }, next: start + 1 };
    case "regex":
      return { node: { kind: "regex", value: token.value, flags: token.flags ?? "" }, next: start + 1 };
    case "identifier":
      if (KEYWORDS.has(token.value)) {
        return { node: { kind: "keyword", value: token.value }, next: start + 1 };
      }
      return parseRawExpression(tokens, start);
    case "punct":
      if (token.value === "{") return parseObject(tokens, start);
      if (token.value === "[") return parseArray(tokens, start);
      // "(", ")" and everything else: preserve as a raw expression.
      return parseRawExpression(tokens, start);
    case "op": {
      // Unary minus followed by a number becomes a negative number.
      if (token.value === "-") {
        const next = tokens[start + 1];
        if (next && next.type === "number") {
          return { node: { kind: "number", raw: "-" + next.value }, next: start + 2 };
        }
      }
      return parseRawExpression(tokens, start);
    }
  }
}

/**
 * Collects tokens belonging to an unparsed expression (function calls,
 * variables, operators) until a `,`, `}` or `]` at nesting depth zero.
 */
function parseRawExpression(tokens: Token[], start: number): { node: Node; next: number } {
  let i = start;
  let depth = 0;
  const parts: string[] = [];
  let prev: Token | undefined;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === "punct") {
      if (token.value === "(" || token.value === "[" || token.value === "{") {
        depth++;
      } else if (token.value === ")" || token.value === "]" || token.value === "}") {
        // A closing bracket at depth zero belongs to the enclosing literal.
        if (depth === 0) break;
        depth--;
      } else if (token.value === "," && depth === 0) {
        break;
      }
    }

    if (prev && needsSpace(prev, token)) parts.push(" ");
    parts.push(tokenText(token));
    prev = token;
    i++;
  }

  if (i === start) {
    throw new FormatSyntaxError(`Unexpected token "${tokens[start].value}"`, tokens[start].pos);
  }
  return { node: { kind: "raw", text: parts.join("") }, next: i };
}

/** Spacing rules for reconstructed raw expressions (pretty mode). */
function needsSpace(prev: Token, next: Token): boolean {
  const p = prev.value;
  const n = next.value;
  if (p === "." || n === ".") return false;
  if (n === ")" || n === "]" || n === ",") return false;
  if (p === "(" || p === "[") return false;
  if (n === "(" || n === "[") return false;
  return true;
}
