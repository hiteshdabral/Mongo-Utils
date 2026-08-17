import { describe, expect, it } from "vitest";
import { formatUriSummary, parseMongoUri } from "./parseMongoUri";

describe("parseMongoUri — basics", () => {
  it("parses a simple mongodb URI", () => {
    const parsed = parseMongoUri("mongodb://localhost:27017/mydb");
    expect(parsed.scheme).toBe("mongodb");
    expect(parsed.host).toBe("localhost");
    expect(parsed.port).toBe(27017);
    expect(parsed.database).toBe("mydb");
    expect(parsed.username).toBeNull();
    expect(parsed.password).toBeNull();
    expect(parsed.options).toEqual([]);
  });

  it("parses credentials", () => {
    const parsed = parseMongoUri("mongodb://username:password@localhost:27017/mydb");
    expect(parsed.username).toBe("username");
    expect(parsed.password).toBe("password");
    expect(parsed.database).toBe("mydb");
  });

  it("applies the default port when omitted", () => {
    const parsed = parseMongoUri("mongodb://localhost/mydb");
    expect(parsed.port).toBeNull();
    expect(parsed.effectivePort).toBe(27017);
  });

  it("handles a username without password", () => {
    const parsed = parseMongoUri("mongodb://user@localhost/db");
    expect(parsed.username).toBe("user");
    expect(parsed.password).toBeNull();
  });

  it("parses query parameters", () => {
    const parsed = parseMongoUri("mongodb://localhost/db?retryWrites=true&w=majority");
    expect(parsed.options).toHaveLength(2);
    expect(parsed.connectionOptions.map((o) => o.key)).toEqual(["retryWrites", "w"]);
  });
});

describe("parseMongoUri — mongodb+srv", () => {
  it("parses an SRV URI", () => {
    const parsed = parseMongoUri("mongodb+srv://cluster0.example.com");
    expect(parsed.scheme).toBe("mongodb+srv");
    expect(parsed.protocol).toBe("mongodb+srv://");
    expect(parsed.host).toBe("cluster0.example.com");
    expect(parsed.database).toBeNull();
  });

  it("warns about a port in an SRV URI", () => {
    const parsed = parseMongoUri("mongodb+srv://cluster0.example.com:27017/db");
    expect(parsed.warnings.some((w) => /Ports are not allowed/i.test(w))).toBe(true);
  });

  it("warns about a database in an SRV URI", () => {
    const parsed = parseMongoUri("mongodb+srv://cluster0.example.com/db");
    expect(parsed.warnings.some((w) => /authSource/i.test(w))).toBe(true);
  });

  it("parses authSource on an SRV URI", () => {
    const parsed = parseMongoUri(
      "mongodb+srv://user:p%40ss@cluster0.example.com/?authSource=admin"
    );
    expect(parsed.authOptions).toHaveLength(1);
    expect(parsed.authOptions[0]).toMatchObject({ key: "authSource", value: "admin" });
    expect(parsed.password).toBe("p@ss");
  });
});

describe("parseMongoUri — encoding", () => {
  it("decodes URL-encoded credentials", () => {
    const parsed = parseMongoUri("mongodb://u%40ser:p%40ss%3Aword@localhost/db");
    expect(parsed.username).toBe("u@ser");
    expect(parsed.password).toBe("p@ss:word");
  });

  it("rejects invalid percent-encoding", () => {
    expect(() => parseMongoUri("mongodb://user:pa%ZZss@localhost/db")).toThrow(
      /percent-encoding/i
    );
  });

  it("decodes a database name with special characters", () => {
    const parsed = parseMongoUri("mongodb://localhost/my%20db%2Ftest");
    expect(parsed.database).toBe("my db/test");
  });
});

describe("parseMongoUri — multiple hosts and IPv6", () => {
  it("parses a replica-set style host list", () => {
    const parsed = parseMongoUri("mongodb://host1:27017,host2:27018/db?replicaSet=rs0");
    expect(parsed.hosts).toEqual([
      { host: "host1", port: 27017 },
      { host: "host2", port: 27018 },
    ]);
    expect(parsed.replicaSetOptions).toHaveLength(1);
    expect(parsed.replicaSetOptions[0].value).toBe("rs0");
  });

  it("parses an IPv6 host", () => {
    const parsed = parseMongoUri("mongodb://[::1]:27017/db");
    expect(parsed.hosts).toEqual([{ host: "::1", port: 27017 }]);
  });

  it("parses an unbracketed IPv6 host as a hostname", () => {
    const parsed = parseMongoUri("mongodb://2001:db8::1/db");
    expect(parsed.hosts[0].host).toBe("2001:db8::1");
  });
});

describe("parseMongoUri — options", () => {
  it("categorizes authentication, replica set and connection options", () => {
    const parsed = parseMongoUri(
      "mongodb://localhost/db?authSource=admin&replicaSet=rs0&tls=true&retryWrites=false&foo=bar"
    );
    expect(parsed.authOptions.map((o) => o.key)).toEqual(["authSource"]);
    expect(parsed.replicaSetOptions.map((o) => o.key)).toEqual(["replicaSet"]);
    expect(parsed.connectionOptions.map((o) => o.key)).toEqual(["tls", "retryWrites"]);
    expect(parsed.otherOptions.map((o) => o.key)).toEqual(["foo"]);
  });

  it("warns about unknown options", () => {
    const parsed = parseMongoUri("mongodb://localhost/db?foo=bar");
    expect(parsed.warnings.some((w) => /Unknown connection option "foo"/.test(w))).toBe(true);
  });
});

describe("parseMongoUri — invalid input", () => {
  it("rejects an empty string", () => {
    expect(() => parseMongoUri("")).toThrow(/Enter a MongoDB connection string/i);
  });

  it("rejects non-MongoDB schemes", () => {
    expect(() => parseMongoUri("http://localhost/db")).toThrow(/must start with/i);
    expect(() => parseMongoUri("localhost:27017")).toThrow(/must start with/i);
  });

  it("rejects a URI with no host", () => {
    expect(() => parseMongoUri("mongodb:///db")).toThrow(/Missing host/i);
  });

  it("rejects an invalid port", () => {
    expect(() => parseMongoUri("mongodb://localhost:abc/db")).toThrow(/Invalid port/i);
    expect(() => parseMongoUri("mongodb://localhost:99999/db")).toThrow(/out of range/i);
  });

  it("warns when a password exists without a username", () => {
    const parsed = parseMongoUri("mongodb://:secret@localhost/db");
    expect(parsed.username).toBe("");
    expect(parsed.password).toBe("secret");
    expect(parsed.warnings.some((w) => /without a username/i.test(w))).toBe(true);
  });
});

describe("formatUriSummary", () => {
  it("masks the password by default", () => {
    const parsed = parseMongoUri("mongodb://user:secret@localhost/db");
    const summary = formatUriSummary(parsed, false);
    expect(summary).not.toContain("secret");
    expect(summary).toContain("••••••••");
  });

  it("reveals the password only when asked", () => {
    const parsed = parseMongoUri("mongodb://user:secret@localhost/db");
    expect(formatUriSummary(parsed, true)).toContain("Password: secret");
  });
});
