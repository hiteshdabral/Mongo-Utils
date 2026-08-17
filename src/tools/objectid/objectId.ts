/**
 * Client-side MongoDB ObjectId parsing and generation.
 *
 * An ObjectId is a 12-byte value usually written as 24 hexadecimal characters:
 *   4-byte timestamp (seconds since Unix epoch)
 *   5-byte random value (machine + process identifier)
 *   3-byte incrementing counter
 *
 * No MongoDB driver is required — all logic runs in the browser.
 */

export interface ObjectIdInfo {
  /** The original 24-character hex string. */
  hex: string;
  /** Creation timestamp in seconds since the Unix epoch. */
  timestampSeconds: number;
  /** Creation timestamp in milliseconds since the Unix epoch. */
  timestampMs: number;
  /** Creation time as an ISO 8601 string (UTC). */
  utcIso: string;
  /** Creation time in the viewer's local timezone. */
  localString: string;
  /** Machine/process bytes (hex, 8 chars). */
  machine: string;
  /** Counter bytes (hex, 6 chars). */
  counter: string;
}

const OBJECTID_PATTERN = /^[0-9a-fA-F]{24}$/;

/** Returns true when `input` is a structurally valid 24-character ObjectId hex string. */
export function isValidObjectId(input: string): boolean {
  return OBJECTID_PATTERN.test(input);
}

/**
 * Parses an ObjectId and extracts its embedded creation timestamp.
 * Throws a TypeError when the input is not a valid ObjectId.
 */
export function parseObjectId(input: string): ObjectIdInfo {
  const hex = input.trim();
  if (!isValidObjectId(hex)) {
    throw new TypeError(
      "Invalid ObjectId. An ObjectId is exactly 24 hexadecimal characters, e.g. 507f1f77bcf86cd799439011."
    );
  }

  const timestampSeconds = parseInt(hex.slice(0, 8), 16);
  const date = new Date(timestampSeconds * 1000);

  return {
    hex,
    timestampSeconds,
    timestampMs: timestampSeconds * 1000,
    utcIso: date.toISOString(),
    localString: date.toString(),
    machine: hex.slice(8, 16),
    counter: hex.slice(16, 24),
  };
}

const HEX_CHARS = "0123456789abcdef";

function randomBytes(length: number): number[] {
  const bytes: number[] = [];
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
    const buf = new Uint8Array(length);
    globalThis.crypto.getRandomValues(buf);
    for (let i = 0; i < buf.length; i++) bytes.push(buf[i]);
  } else {
    for (let i = 0; i < length; i++) bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes;
}

function toHexByte(value: number): string {
  return HEX_CHARS[(value >> 4) & 0x0f] + HEX_CHARS[value & 0x0f];
}

/**
 * Generates a new ObjectId using the timestamp of `date` (defaults to now)
 * and a cryptographically random suffix.
 */
export function generateObjectId(date: Date = new Date()): string {
  const seconds = Math.floor(date.getTime() / 1000) >>> 0;
  const timestampHex =
    HEX_CHARS[(seconds >>> 28) & 0x0f] +
    HEX_CHARS[(seconds >>> 24) & 0x0f] +
    HEX_CHARS[(seconds >>> 20) & 0x0f] +
    HEX_CHARS[(seconds >>> 16) & 0x0f] +
    HEX_CHARS[(seconds >>> 12) & 0x0f] +
    HEX_CHARS[(seconds >>> 8) & 0x0f] +
    HEX_CHARS[(seconds >>> 4) & 0x0f] +
    HEX_CHARS[seconds & 0x0f];

  const randomHex = randomBytes(8).map(toHexByte).join("");
  return timestampHex + randomHex;
}

/** Builds a readable text summary of a parsed ObjectId (used for the output area and copy). */
export function formatObjectIdSummary(info: ObjectIdInfo): string {
  return [
    `ObjectId: ${info.hex}`,
    `Timestamp (Unix seconds): ${info.timestampSeconds}`,
    `Timestamp (Unix ms): ${info.timestampMs}`,
    `UTC date: ${info.utcIso}`,
    `Local date: ${info.localString}`,
    `Machine bytes: ${info.machine}`,
    `Counter bytes: ${info.counter}`,
  ].join("\n");
}
