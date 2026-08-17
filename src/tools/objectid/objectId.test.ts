import { describe, expect, it } from "vitest";
import {
  formatObjectIdSummary,
  generateObjectId,
  isValidObjectId,
  parseObjectId,
} from "./objectId";

describe("isValidObjectId", () => {
  it("accepts a valid 24-character hex ObjectId", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("accepts uppercase hex", () => {
    expect(isValidObjectId("507F1F77BCF86CD799439011")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false);
    expect(isValidObjectId("507f1f77bcf86cd7994390112")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901g")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isValidObjectId("")).toBe(false);
  });
});

describe("parseObjectId", () => {
  it("extracts the timestamp of a known ObjectId", () => {
    const info = parseObjectId("507f1f77bcf86cd799439011");
    expect(info.timestampSeconds).toBe(0x507f1f77);
    expect(info.utcIso).toBe(new Date(0x507f1f77 * 1000).toISOString());
  });

  it("handles the minimum timestamp boundary (epoch)", () => {
    const info = parseObjectId("000000000000000000000000");
    expect(info.timestampSeconds).toBe(0);
    expect(info.utcIso).toBe("1970-01-01T00:00:00.000Z");
  });

  it("handles the maximum timestamp boundary", () => {
    const info = parseObjectId("ffffffffffffffffffffffff");
    expect(info.timestampSeconds).toBe(4294967295);
    expect(info.utcIso).toBe(new Date(4294967295 * 1000).toISOString());
  });

  it("trims surrounding whitespace", () => {
    const info = parseObjectId("  507f1f77bcf86cd799439011  ");
    expect(info.timestampSeconds).toBe(0x507f1f77);
  });

  it("exposes machine and counter bytes", () => {
    const info = parseObjectId("507f1f77bcf86cd799439011");
    expect(info.machine).toBe("bcf86cd7");
    expect(info.counter).toBe("99439011");
  });

  it("throws on invalid input", () => {
    expect(() => parseObjectId("")).toThrow();
    expect(() => parseObjectId("not-an-objectid")).toThrow();
  });
});

describe("generateObjectId", () => {
  it("produces a valid ObjectId", () => {
    const hex = generateObjectId();
    expect(isValidObjectId(hex)).toBe(true);
  });

  it("embeds the given date as timestamp", () => {
    const date = new Date("2024-01-01T12:00:00.000Z");
    const hex = generateObjectId(date);
    expect(parseObjectId(hex).timestampSeconds).toBe(Math.floor(date.getTime() / 1000));
  });

  it("uses the current time by default", () => {
    const before = Math.floor(Date.now() / 1000) - 1;
    const hex = generateObjectId();
    const after = Math.floor(Date.now() / 1000) + 1;
    const ts = parseObjectId(hex).timestampSeconds;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("produces different values on repeated calls", () => {
    const ids = new Set([generateObjectId(), generateObjectId(), generateObjectId()]);
    expect(ids.size).toBe(3);
  });
});

describe("formatObjectIdSummary", () => {
  it("includes the key fields", () => {
    const info = parseObjectId("507f1f77bcf86cd799439011");
    const summary = formatObjectIdSummary(info);
    expect(summary).toContain("ObjectId: 507f1f77bcf86cd799439011");
    expect(summary).toContain("UTC date:");
    expect(summary).toContain("Local date:");
    expect(summary).toContain("Timestamp (Unix seconds):");
  });
});
