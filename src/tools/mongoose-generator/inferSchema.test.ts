import { describe, expect, it } from "vitest";
import { generateMongooseSchema, sanitizeModelName } from "./inferSchema";

describe("generateMongooseSchema — document example", () => {
  it("infers primitive types", () => {
    const json = JSON.stringify({
      name: "John",
      age: 25,
      active: true,
      tags: ["node", "mongodb"],
    });
    const code = generateMongooseSchema(json, { modelName: "User" });
    expect(code).toContain("const UserSchema = new mongoose.Schema({");
    expect(code).toContain("  name: String,");
    expect(code).toContain("  age: Number,");
    expect(code).toContain("  active: Boolean,");
    expect(code).toContain("  tags: [String]");
    expect(code).toContain('const User = mongoose.model("User", UserSchema);');
  });
});

describe("generateMongooseSchema — nested and arrays", () => {
  it("handles nested objects", () => {
    const json = JSON.stringify({ address: { city: "Berlin", zip: 10115 } });
    const code = generateMongooseSchema(json, { modelName: "User" });
    expect(code).toContain("  address: new mongoose.Schema({");
    expect(code).toContain('    city: String,');
    expect(code).toContain("    zip: Number\n");
    expect(code).toContain("  })\n");
  });

  it("handles arrays of objects", () => {
    const json = JSON.stringify({ orders: [{ sku: "a" }, { sku: "b" }] });
    const code = generateMongooseSchema(json, { modelName: "User" });
    expect(code).toContain("  orders: [new mongoose.Schema({");
    expect(code).toContain("    sku: String\n");
  });

  it("handles empty arrays", () => {
    const json = JSON.stringify({ tags: [] });
    expect(generateMongooseSchema(json, { modelName: "User" })).toContain("  tags: []");
  });

  it("handles mixed-type arrays", () => {
    const json = JSON.stringify({ values: [1, "two", true] });
    expect(generateMongooseSchema(json, { modelName: "User" })).toContain(
      "  values: [Schema.Types.Mixed]"
    );
  });

  it("handles arrays of arrays", () => {
    const json = JSON.stringify({ matrix: [[1, 2], [3, 4]] });
    expect(generateMongooseSchema(json, { modelName: "User" })).toContain(
      "  matrix: [[Number]]"
    );
  });

  it("handles null values as Mixed", () => {
    const json = JSON.stringify({ profile: null });
    expect(generateMongooseSchema(json, { modelName: "User" })).toContain(
      "  profile: Schema.Types.Mixed"
    );
  });

  it("handles empty objects as Mixed", () => {
    const json = JSON.stringify({ meta: {} });
    expect(generateMongooseSchema(json, { modelName: "User" })).toContain(
      "  meta: Schema.Types.Mixed"
    );
  });
});

describe("generateMongooseSchema — model name handling", () => {
  it("sanitizes free-form model names", () => {
    const json = JSON.stringify({ name: "x" });
    expect(generateMongooseSchema(json, { modelName: "blog posts" })).toContain(
      "const BlogPostsSchema = new mongoose.Schema({"
    );
  });

  it("has a fallback for empty model names", () => {
    const json = JSON.stringify({ name: "x" });
    expect(generateMongooseSchema(json, { modelName: "  " })).toContain(
      "const DocumentSchema = new mongoose.Schema({"
    );
  });

  it("handles unicode field names by quoting them", () => {
    const json = JSON.stringify({ "my key": 1, café: "x" });
    const code = generateMongooseSchema(json, { modelName: "Thing" });
    expect(code).toContain('  "my key": Number,');
    expect(code).toContain("  café: String");
  });

  it("infers from an array of documents using the first element", () => {
    const json = JSON.stringify([{ a: 1 }, { b: "x" }]);
    expect(generateMongooseSchema(json, { modelName: "Item" })).toContain("  a: Number");
  });
});

describe("generateMongooseSchema — errors and boundaries", () => {
  it("rejects invalid JSON", () => {
    expect(() => generateMongooseSchema("{not json", { modelName: "User" })).toThrow(/Invalid JSON/);
  });

  it("rejects empty input", () => {
    expect(() => generateMongooseSchema("   ", { modelName: "User" })).toThrow(/Enter a JSON/);
  });

  it("rejects non-object roots", () => {
    expect(() => generateMongooseSchema("42", { modelName: "User" })).toThrow(/Unable to infer/);
    expect(() => generateMongooseSchema("[]", { modelName: "User" })).toThrow(/Unable to infer/);
  });

  it("handles large nested documents without recursion problems", () => {
    let value: unknown = 1;
    for (let i = 0; i < 200; i++) value = { level: value };
    const json = JSON.stringify({ root: value });
    const code = generateMongooseSchema(json, { modelName: "Deep" });
    expect(code).toContain("root: new mongoose.Schema({");
  });

  it("keeps duplicate keys resolved the same way JSON.parse does", () => {
    const code = generateMongooseSchema('{"a": 1, "a": "two"}', { modelName: "User" });
    expect(code).toContain("  a: String");
  });
});

describe("generateMongooseSchema — MongoDB shell / Extended JSON", () => {
  it("maps $oid wrappers to ObjectId", () => {
    const json = JSON.stringify({ _id: { $oid: "6a55c12097b6a22b9af61b09" } });
    expect(generateMongooseSchema(json, { modelName: "Trip" })).toContain(
      "  _id: Schema.Types.ObjectId"
    );
  });

  it("maps $date wrappers to Date", () => {
    const json = JSON.stringify({ createdAt: { $date: "2026-07-14T04:54:56.771Z" } });
    expect(generateMongooseSchema(json, { modelName: "Trip" })).toContain(
      "  createdAt: Date"
    );
  });

  it("maps numeric wrappers to Number", () => {
    const json = JSON.stringify({
      __v: { $numberInt: "0" },
      total: { $numberLong: "5" },
      price: { $numberDecimal: "1.50" },
    });
    const code = generateMongooseSchema(json, { modelName: "Trip" });
    expect(code).toContain("  __v: Number");
    expect(code).toContain("  total: Number");
    expect(code).toContain("  price: Number");
  });

  it("parses mongosh-style output with helpers, unquoted keys and single quotes", () => {
    const shell = `{
      _id: ObjectId('6a55c12097b6a22b9af61b09'),
      name: 'Trip Template',
      uid: 31,
      __v: NumberInt('0'),
      createdAt: ISODate('2026-07-14T04:54:56.771Z'),
      permissions: { roles: { '6a55c12097b6a22b9af61adb': { create: true } } }
    }`;
    const code = generateMongooseSchema(shell, { modelName: "TripTemplate" });
    expect(code).toContain("  _id: Schema.Types.ObjectId");
    expect(code).toContain("  name: String");
    expect(code).toContain("  uid: Number");
    expect(code).toContain("  __v: Number");
    expect(code).toContain("  createdAt: Date");
    expect(code).toContain("  create: Boolean");
  });
});

describe("sanitizeModelName", () => {
  it("returns PascalCase words", () => {
    expect(sanitizeModelName("user")).toBe("User");
    expect(sanitizeModelName("blog-posts")).toBe("BlogPosts");
    expect(sanitizeModelName("ORDER ITEMS")).toBe("ORDERITEMS");
  });

  it("falls back for empty input", () => {
    expect(sanitizeModelName("")).toBe("Document");
    expect(sanitizeModelName("!!!")).toBe("Document");
  });
});
