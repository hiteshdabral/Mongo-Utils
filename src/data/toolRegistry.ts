export interface ToolMeta {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  path: string;
}

/** Registry of the five MVP tools (order defines homepage/tools listing). */
export const TOOLS: ToolMeta[] = [
  {
    slug: "mongodb-objectid-timestamp",
    title: "MongoDB ObjectId to Timestamp",
    shortTitle: "ObjectId → Timestamp",
    description:
      "Convert a MongoDB ObjectId into its creation timestamp, UTC and local date. Validate and generate ObjectIds.",
    path: "/tools/mongodb-objectid-timestamp/",
  },
  {
    slug: "mongodb-uri-parser",
    title: "MongoDB URI Parser",
    shortTitle: "URI Parser",
    description:
      "Parse mongodb:// and mongodb+srv:// connection strings into protocol, hosts, database, credentials and options. Passwords stay masked.",
    path: "/tools/mongodb-uri-parser/",
  },
  {
    slug: "mongodb-query-formatter",
    title: "MongoDB Query Formatter",
    shortTitle: "Query Formatter",
    description:
      "Format or minify MongoDB shell queries like db.users.find(...) with clear validation errors.",
    path: "/tools/mongodb-query-formatter/",
  },
  {
    slug: "mongodb-aggregation-formatter",
    title: "MongoDB Aggregation Formatter",
    shortTitle: "Aggregation Formatter",
    description:
      "Format and minify aggregation pipelines, list every stage and link to the official documentation.",
    path: "/tools/mongodb-aggregation-formatter/",
  },
  {
    slug: "json-to-mongoose",
    title: "JSON to Mongoose Schema",
    shortTitle: "JSON → Mongoose",
    description:
      "Generate a Mongoose schema from a JSON document. Infers types, arrays and nested objects.",
    path: "/tools/json-to-mongoose/",
  },
];

export function toolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
