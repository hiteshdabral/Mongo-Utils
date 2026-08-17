/**
 * Aggregation pipeline helpers: stage extraction and documentation links.
 */

import { parseLiteralAt } from "./parser";
import { tokenize } from "./tokenizer";
import { validateJsLike } from "./index";

export interface PipelineStage {
  /** 1-based position in the pipeline. */
  index: number;
  /** Stage operator, e.g. "$match". */
  name: string;
  /** Link to the official MongoDB documentation. */
  docsUrl: string;
}

const STAGE_DOC_BASE = "https://www.mongodb.com/docs/manual/reference/operator/aggregation/";

const STAGE_DOCS: Record<string, string> = {
  $addFields: "addFields/",
  $bucket: "bucket/",
  $bucketAuto: "bucketAuto/",
  $changeStream: "changeStream/",
  $collStats: "collStats/",
  $count: "count/",
  $densify: "densify/",
  $documents: "documents/",
  $facet: "facet/",
  $fill: "fill/",
  $geoNear: "geoNear/",
  $graphLookup: "graphLookup/",
  $group: "group/",
  $indexStats: "indexStats/",
  $limit: "limit/",
  $lookup: "lookup/",
  $match: "match/",
  $merge: "merge/",
  $out: "out/",
  $planCacheStats: "planCacheStats/",
  $project: "project/",
  $redact: "redact/",
  $replaceRoot: "replaceRoot/",
  $replaceWith: "replaceWith/",
  $sample: "sample/",
  $set: "set/",
  $setWindowFields: "setWindowFields/",
  $skip: "skip/",
  $sort: "sort/",
  $sortByCount: "sortByCount/",
  $unionWith: "unionWith/",
  $unset: "unset/",
  $unwind: "unwind/",
};

export function stageDocsUrl(stageName: string): string | null {
  const path = STAGE_DOCS[stageName];
  return path ? STAGE_DOC_BASE + path : null;
}

/**
 * Extracts the list of pipeline stages from JavaScript-like input when the
 * input is (or contains) a top-level array of stage objects.
 * Returns an empty array when no stages can be identified.
 */
export function extractStages(input: string): PipelineStage[] {
  if (validateJsLike(input) !== null) return [];
  const tokens = tokenize(input);

  // Find the first `[` token that starts the top-level expression.
  let arrayIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "punct" && token.value === "[") {
      const prev = tokens[i - 1];
      if (!prev) {
        arrayIndex = i;
        break;
      }
      if (prev.type === "punct" && ["(", ",", ":", "["].includes(prev.value)) {
        arrayIndex = i;
        break;
      }
    }
  }
  if (arrayIndex === -1) return [];

  const { node } = parseLiteralAt(tokens, arrayIndex);
  if (node.kind !== "array") return [];

  const stages: PipelineStage[] = [];
  let index = 0;
  for (const item of node.items) {
    index++;
    if (item.kind !== "object") continue;
    const first = item.entries[0];
    if (!first) continue;
    if (!first.key.startsWith("$")) continue;
    stages.push({
      index,
      name: first.key,
      docsUrl: stageDocsUrl(first.key) ?? STAGE_DOC_BASE,
    });
  }
  return stages;
}
