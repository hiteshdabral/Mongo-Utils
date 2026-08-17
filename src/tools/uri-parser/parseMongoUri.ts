/**
 * Client-side MongoDB connection string (URI) parser.
 *
 * Supports `mongodb://` and `mongodb+srv://` schemes, percent-encoded
 * credentials, multiple hosts, query parameters, replica-set and
 * authentication options.
 *
 * This module never transmits anything — parsing happens entirely in the
 * browser. Callers are responsible for masking passwords in the UI.
 */

export type UriScheme = "mongodb" | "mongodb+srv";
export type OptionCategory = "auth" | "replicaSet" | "connection" | "other";

export interface MongoHost {
  host: string;
  port: number | null;
}

export interface UriOption {
  key: string;
  value: string;
  category: OptionCategory;
}

export interface ParsedMongoUri {
  scheme: UriScheme;
  /** e.g. `mongodb+srv://` */
  protocol: string;
  hosts: MongoHost[];
  /** First host name (convenience for display). */
  host: string | null;
  /** Port of the first host, or null. */
  port: number | null;
  /** Effective port including MongoDB's default of 27017. */
  effectivePort: number;
  /** Decoded database name, or null when absent. */
  database: string | null;
  /** Decoded username, or null when absent. */
  username: string | null;
  /** Decoded password, or null when absent. */
  password: string | null;
  /** Every query parameter, categorized. */
  options: UriOption[];
  /** Authentication-related options (authSource, authMechanism, …). */
  authOptions: UriOption[];
  /** Replica-set options (replicaSet). */
  replicaSetOptions: UriOption[];
  /** Connection/behaviour options (tls, retryWrites, readPreference, …). */
  connectionOptions: UriOption[];
  /** Uncategorized query parameters. */
  otherOptions: UriOption[];
  warnings: string[];
}

export class MongoUriError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MongoUriError";
  }
}

const DEFAULT_PORT = 27017;

const AUTH_OPTION_KEYS = new Set(["authSource", "authMechanism", "authMechanismProperties"]);
const REPLICA_SET_OPTION_KEYS = new Set(["replicaSet"]);
const CONNECTION_OPTION_KEYS = new Set([
  "tls",
  "ssl",
  "tlsInsecure",
  "tlsAllowInvalidCertificates",
  "tlsAllowInvalidHostnames",
  "tlsCAFile",
  "tlsCertificateKeyFile",
  "retryWrites",
  "retryReads",
  "w",
  "wTimeoutMS",
  "journal",
  "readPreference",
  "readPreferenceTags",
  "readConcernLevel",
  "maxPoolSize",
  "minPoolSize",
  "maxIdleTimeMS",
  "waitQueueTimeoutMS",
  "connectTimeoutMS",
  "socketTimeoutMS",
  "serverSelectionTimeoutMS",
  "localThresholdMS",
  "heartbeatFrequencyMS",
  "directConnection",
  "compressors",
  "zlibCompressionLevel",
  "appName",
  "maxStalenessSeconds",
  "uuidRepresentation",
  "loadBalanced",
  "srvMaxHosts",
  "srvServiceName",
]);

function categorizeOption(key: string): OptionCategory {
  if (AUTH_OPTION_KEYS.has(key)) return "auth";
  if (REPLICA_SET_OPTION_KEYS.has(key)) return "replicaSet";
  if (CONNECTION_OPTION_KEYS.has(key)) return "connection";
  return "other";
}

function tryDecode(value: string, label: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new MongoUriError(`Invalid percent-encoding in ${label}.`);
  }
}

function parsePort(raw: string): number {
  if (raw === "") throw new MongoUriError("Missing port after \":\" in host list.");
  if (!/^\d+$/.test(raw)) throw new MongoUriError(`Invalid port "${raw}". Ports must be numbers.`);
  const port = Number(raw);
  if (port < 1 || port > 65535) throw new MongoUriError(`Port out of range: ${raw}.`);
  return port;
}

function parseHost(raw: string): MongoHost {
  const host = raw.trim();
  if (host === "") throw new MongoUriError("Empty host in host list.");

  // IPv6 literal, e.g. [::1]:27017
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end === -1) throw new MongoUriError("Invalid IPv6 host: missing closing \"]\".");
    const name = host.slice(1, end);
    if (name === "") throw new MongoUriError("Empty IPv6 host.");
    const rest = host.slice(end + 1);
    if (rest === "") return { host: name, port: null };
    if (!rest.startsWith(":")) {
      throw new MongoUriError(`Unexpected text after IPv6 host: "${rest}".`);
    }
    return { host: name, port: parsePort(rest.slice(1)) };
  }

  const colon = host.lastIndexOf(":");
  if (colon === -1) return { host, port: null };
  // Unbracketed IPv6 shorthand (e.g. 2001:db8::1) — more than one colon.
  if (host.indexOf(":") !== colon) return { host, port: null };
  if (colon === 0) throw new MongoUriError(`Invalid host "${host}".`);

  const name = host.slice(0, colon);
  const port = parsePort(host.slice(colon + 1));
  if (name === "") throw new MongoUriError(`Invalid host "${host}".`);
  return { host: name, port };
}

function parseOptions(rawQuery: string): UriOption[] {
  if (rawQuery === "") return [];
  const options: UriOption[] = [];
  for (const pair of rawQuery.split("&")) {
    if (pair === "") continue;
    const eq = pair.indexOf("=");
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawValue = eq === -1 ? "" : pair.slice(eq + 1);
    if (rawKey === "") throw new MongoUriError("Empty query parameter name.");
    const key = tryDecode(rawKey, "option name");
    const value = tryDecode(rawValue, `value of option "${key}"`);
    options.push({ key, value, category: categorizeOption(key) });
  }
  return options;
}

/**
 * Parses a MongoDB connection string into structured parts.
 * Throws MongoUriError for malformed input.
 */
export function parseMongoUri(input: string): ParsedMongoUri {
  const uri = input.trim();
  if (uri === "") throw new MongoUriError("Enter a MongoDB connection string to parse.");

  const schemeMatch = /^(mongodb(?:\+srv)?):\/\//i.exec(uri);
  if (!schemeMatch) {
    throw new MongoUriError(
      'URI must start with "mongodb://" or "mongodb+srv://".'
    );
  }
  const scheme = schemeMatch[1].toLowerCase() as UriScheme;
  const isSrv = scheme === "mongodb+srv";
  const protocol = scheme + "://";

  const rest = uri.slice(schemeMatch[0].length);

  // Split authority / database / query at the first unencoded "/" or "?".
  let authority = rest;
  let databasePart = "";
  let queryPart = "";
  const slash = rest.indexOf("/");
  const question = rest.indexOf("?");
  const firstBreak =
    slash === -1 ? question : question === -1 ? slash : Math.min(slash, question);
  if (firstBreak !== -1) {
    authority = rest.slice(0, firstBreak);
    const after = rest.slice(firstBreak);
    if (after.startsWith("/")) {
      const dbBreak = after.indexOf("?");
      databasePart = dbBreak === -1 ? after.slice(1) : after.slice(1, dbBreak);
      queryPart = dbBreak === -1 ? "" : after.slice(dbBreak + 1);
    } else {
      queryPart = after.slice(1);
    }
  }

  if (authority === "") throw new MongoUriError("Missing host. Provide at least one hostname.");

  // Credentials: split authority on the LAST "@" (raw "@" is not allowed in userinfo).
  let username: string | null = null;
  let password: string | null = null;
  const at = authority.lastIndexOf("@");
  if (at !== -1) {
    const userinfo = authority.slice(0, at);
    authority = authority.slice(at + 1);
    if (authority === "") throw new MongoUriError("Missing host after credentials.");
    const colon = userinfo.indexOf(":");
    if (colon === -1) {
      username = tryDecode(userinfo, "username");
    } else {
      username = tryDecode(userinfo.slice(0, colon), "username");
      password = tryDecode(userinfo.slice(colon + 1), "password");
    }
  }

  const hosts = authority.split(",").map(parseHost);
  const database = databasePart === "" ? null : tryDecode(databasePart, "database name");
  const options = parseOptions(queryPart);

  const warnings: string[] = [];
  if (password !== null && (username === null || username === "")) {
    warnings.push("A password was provided without a username.");
  }
  if (isSrv) {
    if (hosts.length > 1) {
      warnings.push("mongodb+srv URIs expect a single hostname; multiple hosts were provided.");
    }
    if (hosts.some((h) => h.port !== null)) {
      warnings.push("Ports are not allowed in mongodb+srv URIs; the port is discovered via DNS.");
    }
    if (database !== null) {
      warnings.push(
        "A database in a mongodb+srv URI is discouraged; use the authSource option instead."
      );
    }
  }
  for (const option of options) {
    if (option.category === "other") {
      warnings.push(`Unknown connection option "${option.key}".`);
    }
  }

  return {
    scheme,
    protocol,
    hosts,
    host: hosts[0]?.host ?? null,
    port: hosts[0]?.port ?? null,
    effectivePort: hosts[0]?.port ?? DEFAULT_PORT,
    database,
    username,
    password,
    options,
    authOptions: options.filter((o) => o.category === "auth"),
    replicaSetOptions: options.filter((o) => o.category === "replicaSet"),
    connectionOptions: options.filter((o) => o.category === "connection"),
    otherOptions: options.filter((o) => o.category === "other"),
    warnings,
  };
}

/** Builds a plain-text summary of the parsed URI. Passwords are masked unless `reveal` is true. */
export function formatUriSummary(parsed: ParsedMongoUri, reveal: boolean): string {
  const lines: string[] = [];
  lines.push(`Protocol: ${parsed.protocol}`);
  lines.push(
    `Host(s): ${parsed.hosts
      .map((h) => (h.port === null ? h.host : `${h.host}:${h.port}`))
      .join(", ")}`
  );
  lines.push(
    `Port: ${parsed.port === null ? `${parsed.effectivePort} (default)` : parsed.port}`
  );
  lines.push(`Database: ${parsed.database ?? "(none)"}`);
  lines.push(`Username: ${parsed.username ?? "(none)"}`);
  lines.push(
    parsed.password === null
      ? "Password: (none)"
      : reveal
        ? `Password: ${parsed.password}`
        : "Password: •••••••• (masked)"
  );
  const optionSummary = (label: string, opts: UriOption[]) =>
    opts.length > 0 ? [`${label}: ${opts.map((o) => (o.value === "" ? o.key : `${o.key}=${o.value}`)).join(", ")}`] : [];
  lines.push(...optionSummary("Authentication options", parsed.authOptions));
  lines.push(...optionSummary("Replica set options", parsed.replicaSetOptions));
  lines.push(...optionSummary("Connection options", parsed.connectionOptions));
  lines.push(...optionSummary("Other query parameters", parsed.otherOptions));
  if (parsed.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    parsed.warnings.forEach((w) => lines.push(`- ${w}`));
  }
  return lines.join("\n");
}
