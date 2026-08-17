import { describe, expect, it } from "vitest";
import { formatQuery, minifyQuery, validateJsLike } from "./index";
import { extractStages } from "./stages";

describe("formatQuery — document examples", () => {
  it("formats the MVP-03 example query", () => {
    // The document's input nests `status` inside `age`, but its intended
    // output (which we match) places `status` at the top level.
    const input = 'db.users.find({age:{$gte:18},status:"active"})';
    const expected = [
      "db.users.find({",
      "  age: {",
      "    $gte: 18",
      "  },",
      '  status: "active"',
      "})",
    ].join("\n");
    expect(formatQuery(input).output).toBe(expected);
  });

  it("formats the MVP-04 example aggregation pipeline", () => {
    const input = '[{$match:{status:"active"}},{$group:{_id:"$department",count:{$sum:1}}},{$sort:{count:-1}}]';
    const expected = [
      "[",
      "  {",
      '    $match: {',
      '      status: "active"',
      "    }",
      "  },",
      "  {",
      "    $group: {",
      '      _id: "$department",',
      "      count: {",
      "        $sum: 1",
      "      }",
      "    }",
      "  },",
      "  {",
      "    $sort: {",
      "      count: -1",
      "    }",
      "  }",
      "]",
    ].join("\n");
    expect(formatQuery(input).output).toBe(expected);
  });
});

describe("formatQuery — wrappers and method chains", () => {
  it("preserves the wrapper expression", () => {
    const result = formatQuery("db.users.find({a:1}).limit(5)");
    expect(result.output).toBe("db.users.find({\n  a: 1\n}).limit(5)");
  });

  it("handles multiple literal arguments", () => {
    const input = "db.users.find({a:1},{b:2})";
    const result = formatQuery(input);
    expect(result.output).toBe("db.users.find({\n  a: 1\n}, {\n  b: 2\n})");
  });

  it("formats a bare object without a wrapper", () => {
    expect(formatQuery("{a:1}").output).toBe("{\n  a: 1\n}");
  });

  it("preserves raw expressions like ObjectId()", () => {
    const input = '{_id: ObjectId("507f1f77bcf86cd799439011")}';
    expect(formatQuery(input).output).toBe('{\n  _id: ObjectId("507f1f77bcf86cd799439011")\n}');
  });

  it("keeps assignment-like raw text", () => {
    const input = "const q = {a:1};";
    expect(formatQuery(input).output).toBe("const q = {\n  a: 1\n};");
  });
});

describe("formatQuery — literal handling", () => {
  it("keeps empty objects and arrays inline", () => {
    expect(formatQuery("{a:{},b:[]}").output).toBe("{\n  a: {},\n  b: []\n}");
  });

  it("keeps short primitive arrays inline", () => {
    const input = '{tags:["node","mongodb"]}';
    expect(formatQuery(input).output).toBe('{\n  tags: ["node", "mongodb"]\n}');
  });

  it("expands arrays containing objects", () => {
    const input = "[{a:1},{b:2}]";
    expect(formatQuery(input).output).toBe("[\n  {\n    a: 1\n  },\n  {\n    b: 2\n  }\n]");
  });

  it("formats negative numbers and exponents", () => {
    const input = "{a:-5,b:1.5,c:1e3,d:-2.5e-2}";
    expect(formatQuery(input).output).toBe("{\n  a: -5,\n  b: 1.5,\n  c: 1e3,\n  d: -2.5e-2\n}");
  });

  it("preserves keywords", () => {
    const input = "{a:true,b:false,c:null,d:undefined}";
    expect(formatQuery(input).output).toBe("{\n  a: true,\n  b: false,\n  c: null,\n  d: undefined\n}");
  });

  it("preserves single-quoted strings", () => {
    const input = "{name: 'it\\'s'}";
    expect(formatQuery(input).output).toBe("{\n  name: 'it\\'s'\n}");
  });

  it("preserves regex literals", () => {
    const input = "{x: {$regex: /^foo/i}}";
    expect(formatQuery(input).output).toBe("{\n  x: {\n    $regex: /^foo/i\n  }\n}");
  });

  it("removes trailing commas", () => {
    expect(formatQuery("{a:1,}").output).toBe("{\n  a: 1\n}");
  });

  it("quotes keys that are not identifiers", () => {
    expect(formatQuery('{"my key":1}').output).toBe('{\n  "my key": 1\n}');
  });

  it("handles unicode strings and keys", () => {
    const input = '{café:"münchen",日本語:1}';
    expect(formatQuery(input).output).toBe('{\n  café: "münchen",\n  日本語: 1\n}');
  });

  it("handles deeply nested objects", () => {
    const input = "{a:{b:{c:{d:1}}}}";
    expect(formatQuery(input).output).toBe(
      "{\n  a: {\n    b: {\n      c: {\n        d: 1\n      }\n    }\n  }\n}"
    );
  });

  it("skips line and block comments", () => {
    expect(formatQuery("{a:1 // comment\n}").output).toBe("{\n  a: 1\n}");
    expect(formatQuery("{/* x */a:1}").output).toBe("{\n  a: 1\n}");
  });
});

describe("formatQuery — validation errors", () => {
  it("reports missing values", () => {
    const error = validateJsLike("{a:}");
    expect(error).not.toBeNull();
    expect(error).toMatch(/position/i);
  });

  it("reports unterminated objects", () => {
    expect(validateJsLike("{a:1")).not.toBeNull();
  });

  it("reports unterminated strings", () => {
    expect(validateJsLike('{a:"x}')).not.toBeNull();
  });

  it("reports unterminated regex", () => {
    expect(validateJsLike("{a: /foo}")).not.toBeNull();
  });

  it("returns null for valid input", () => {
    expect(validateJsLike("{a:1}")).toBeNull();
    expect(validateJsLike("db.users.find({a:1})")).toBeNull();
  });

  it("treats empty input as valid", () => {
    expect(validateJsLike("")).toBeNull();
  });
});

describe("minifyQuery", () => {
  it("minifies a query to a single line", () => {
    const input = 'db.users.find({age: {$gte: 18}, status: "active"})';
    expect(minifyQuery(input).output).toBe('db.users.find({age:{$gte:18},status:"active"})');
  });

  it("minifies an array of stages", () => {
    const input = "[{ $match: { status: \"active\" } }, { $limit: 10 }]";
    expect(minifyQuery(input).output).toBe('[{$match:{status:"active"}},{$limit:10}]');
  });
});

describe("extractStages", () => {
  it("lists stages with documentation links", () => {
    const stages = extractStages('[{ $match: {status:"active"} }, { $group: {_id: "$dept"} }]');
    expect(stages.map((s) => s.name)).toEqual(["$match", "$group"]);
    expect(stages[0].docsUrl).toContain("aggregation/match/");
    expect(stages[1].docsUrl).toContain("aggregation/group/");
  });

  it("works on formatted multi-line output", () => {
    const formatted = formatQuery("[{$match:{a:1}},{$limit:5}]").output;
    expect(extractStages(formatted).map((s) => s.name)).toEqual(["$match", "$limit"]);
  });

  it("returns an empty list for non-pipeline input", () => {
    expect(extractStages("db.users.find({a:1})")).toEqual([]);
    expect(extractStages("{a:1}")).toEqual([]);
    expect(extractStages("")).toEqual([]);
  });

  it("returns an empty list for invalid input", () => {
    expect(extractStages("{a:")).toEqual([]);
  });

  it("ignores non-stage objects inside the pipeline", () => {
    const stages = extractStages('[{ $match: {a:1} }, { note: "x" }, { $limit: 1 }]');
    expect(stages.map((s) => s.name)).toEqual(["$match", "$limit"]);
  });
});
