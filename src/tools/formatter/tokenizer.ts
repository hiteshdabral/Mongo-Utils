/**
 * A safe, deterministic tokenizer for JavaScript-like MongoDB syntax
 * (shell queries and aggregation pipelines).
 *
 * This tokenizer NEVER executes user input. It only produces a token
 * stream that the formatter can re-print. Arbitrary JavaScript such as
 * function bodies is preserved verbatim as "raw" tokens instead of being
 * interpreted.
 */

export type TokenType = "string" | "number" | "identifier" | "regex" | "punct" | "op";

export interface Token {
  type: TokenType;
  /** For strings: content without quotes. For punct/op: the character itself. */
  value: string;
  /** Quote character for string tokens. */
  quote?: '"' | "'";
  /** Flags for regex tokens. */
  flags?: string;
  /** Character offset in the original source (for error messages). */
  pos: number;
}

export class FormatSyntaxError extends Error {
  constructor(message: string, public pos: number) {
    super(`${message} (at position ${pos})`);
    this.name = "FormatSyntaxError";
  }
}

const PUNCT_CHARS = new Set(["{", "}", "[", "]", "(", ")", ":", ",", "."]);

function isIdentStart(ch: string): boolean {
  return /[\p{L}_$]/u.test(ch);
}

function isIdentChar(ch: string): boolean {
  return /[\p{L}\p{N}_$]/u.test(ch);
}

function isDigit(ch: string): boolean {
  return ch >= "0" && ch <= "9";
}

/**
 * Tokens after which a `/` character starts a regular expression literal
 * (value position) rather than an operator.
 */
const REGEX_START_PUNCT = new Set(["(", "[", "{", ",", ":", "="]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const n = source.length;
  let i = 0;
  let prev: Token | undefined;

  const push = (token: Token) => {
    tokens.push(token);
    prev = token;
  };

  while (i < n) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Line comment
    if (ch === "/" && source[i + 1] === "/") {
      while (i < n && source[i] !== "\n") i++;
      continue;
    }

    // Block comment
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) throw new FormatSyntaxError("Unterminated block comment", i);
      i = end + 2;
      continue;
    }

    // String literal
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const start = i;
      i++;
      let value = "";
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") {
          value += source[i];
          i++;
          if (i < n) {
            value += source[i];
            i++;
          }
        } else {
          value += source[i];
          i++;
        }
      }
      if (i >= n) throw new FormatSyntaxError("Unterminated string literal", start);
      i++; // closing quote
      push({ type: "string", value, quote, pos: start });
      continue;
    }

    // Number literal (must start with a digit, or "." followed by a digit)
    if (isDigit(ch) || (ch === "." && i + 1 < n && isDigit(source[i + 1]))) {
      const start = i;
      let raw = "";
      while (i < n && isDigit(source[i])) {
        raw += source[i];
        i++;
      }
      if (source[i] === "." && i + 1 < n && isDigit(source[i + 1])) {
        raw += source[i];
        i++;
        while (i < n && isDigit(source[i])) {
          raw += source[i];
          i++;
        }
      }
      if (source[i] === "e" || source[i] === "E") {
        let j = i + 1;
        let sign = "";
        if (source[j] === "+" || source[j] === "-") {
          sign = source[j];
          j++;
        }
        if (j < n && isDigit(source[j])) {
          raw += source[i] + sign;
          i = j;
          while (i < n && isDigit(source[i])) {
            raw += source[i];
            i++;
          }
        }
      }
      push({ type: "number", value: raw, pos: start });
      continue;
    }

    // Identifier / keyword
    if (isIdentStart(ch)) {
      const start = i;
      let value = "";
      while (i < n && isIdentChar(source[i])) {
        value += source[i];
        i++;
      }
      push({ type: "identifier", value, pos: start });
      continue;
    }

    // Regular expression literal (only in value position)
    if (ch === "/") {
      const atValuePosition =
        prev === undefined ||
        (prev.type === "punct" && REGEX_START_PUNCT.has(prev.value)) ||
        (prev.type === "op" && prev.value === "=");
      if (atValuePosition) {
        const start = i;
        i++;
        let body = "";
        let inClass = false;
        let closed = false;
        while (i < n) {
          const c = source[i];
          if (c === "\\") {
            body += c;
            i++;
            if (i < n) {
              body += source[i];
              i++;
            }
            continue;
          }
          if (c === "\n") throw new FormatSyntaxError("Unterminated regular expression", start);
          if (c === "[") inClass = true;
          if (c === "]") inClass = false;
          if (c === "/" && !inClass) {
            closed = true;
            i++;
            break;
          }
          body += c;
          i++;
        }
        if (!closed) throw new FormatSyntaxError("Unterminated regular expression", start);
        let flags = "";
        while (i < n && /[a-z]/.test(source[i])) {
          flags += source[i];
          i++;
        }
        push({ type: "regex", value: body, flags, pos: start });
        continue;
      }
    }

    // Punctuation
    if (PUNCT_CHARS.has(ch)) {
      push({ type: "punct", value: ch, pos: i });
      i++;
      continue;
    }

    // Anything else: an operator character kept as raw text
    push({ type: "op", value: ch, pos: i });
    i++;
  }

  return tokens;
}

/** Reconstructs the source text of a single token (string quotes included). */
export function tokenText(token: Token): string {
  switch (token.type) {
    case "string":
      return token.quote + token.value + token.quote;
    case "regex":
      return `/${token.value}/${token.flags ?? ""}`;
    default:
      return token.value;
  }
}

/** True when the token can start an object/array literal. */
export function startsLiteral(token: Token | undefined): boolean {
  if (token === undefined) return true;
  if (token.type === "punct") {
    return token.value === "(" || token.value === "[" || token.value === "{" ||
      token.value === "," || token.value === ":";
  }
  return token.type === "op" && token.value === "=";
}
