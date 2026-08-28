export interface RawNode {
  id: string;
  group?: string;
  value?: number;
  meta?: Record<string, unknown>;
}

export interface RawLink {
  source: string;
  target: string;
  value?: number;
}

export interface ParsedGraph {
  nodes: RawNode[];
  links: RawLink[];
  schema: string;
  warnings: string[];
}

export interface ParseFailure {
  message: string;
  line?: number;
  col?: number;
}

/* ------------------------------------------------------------------ */
/* JSON syntax errors with line / column                               */
/* ------------------------------------------------------------------ */

function locate(text: string, position: number) {
  const upto = text.slice(0, Math.max(0, Math.min(position, text.length)));
  const lines = upto.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    const withLine = msg.match(/line (\d+) column (\d+)/);
    const withPos = msg.match(/position (\d+)/);
    let line: number | undefined;
    let col: number | undefined;
    if (withLine) {
      line = Number(withLine[1]);
      col = Number(withLine[2]);
    } else if (withPos) {
      const loc = locate(text, Number(withPos[1]));
      line = loc.line;
      col = loc.col;
    }
    const clean = msg.replace(/\s*\(line \d+ column \d+\)/, "").replace(/^JSON\.parse:\s*/, "");
    const fail: ParseFailure = { message: clean, line, col };
    throw fail;
  }
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const idFields = ["id", "name", "label", "key", "title"];
const groupFields = ["group", "cluster", "type", "category", "team", "kind"];
const valueFields = ["value", "val", "size", "weight", "score", "amount"];
const linkFields = ["links", "edges", "relations", "related", "relatedTo", "dependsOn", "connections", "children", "friends"];

function firstString(obj: Record<string, unknown>, fields: string[]): string | undefined {
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function firstNumber(obj: Record<string, unknown>, fields: string[]): number | undefined {
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function asId(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object") {
    return firstString(v as Record<string, unknown>, [...idFields, "target", "to", "source", "from"]);
  }
  return undefined;
}

function linkWeight(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object") {
    return firstNumber(v as Record<string, unknown>, ["value", "weight", "strength", "w"]);
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* schema converters                                                   */
/* ------------------------------------------------------------------ */

/** classic force-graph payload: { nodes: [...], links|edges: [...] } */
function fromNodesLinks(obj: Record<string, unknown>): ParsedGraph {
  const warnings: string[] = [];
  const rawNodes = Array.isArray(obj.nodes) ? (obj.nodes as unknown[]) : [];
  const rawLinks = (["links", "edges", "relations"] as const)
    .map((k) => obj[k])
    .find((v) => Array.isArray(v)) as unknown[] | undefined;

  const nodes: RawNode[] = rawNodes.map((n, i) => {
    if (n && typeof n === "object" && !Array.isArray(n)) {
      const rec = n as Record<string, unknown>;
      const id = firstString(rec, idFields) ?? `node-${i}`;
      const known = new Set([...idFields, ...groupFields, ...valueFields, ...linkFields]);
      const meta: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rec)) if (!known.has(k)) meta[k] = v;
      return { id, group: firstString(rec, groupFields), value: firstNumber(rec, valueFields), meta };
    }
    return { id: asId(n) ?? `node-${i}` };
  });

  const links: RawLink[] = [];
  for (const l of rawLinks ?? []) {
    if (Array.isArray(l) && l.length >= 2) {
      const s = asId(l[0]);
      const t = asId(l[1]);
      if (s && t) links.push({ source: s, target: t, value: linkWeight(l[2]) });
      continue;
    }
    if (l && typeof l === "object") {
      const rec = l as Record<string, unknown>;
      const s = asId(rec.source ?? rec.from ?? rec.a);
      const t = asId(rec.target ?? rec.to ?? rec.b);
      if (s && t) {
        links.push({ source: s, target: t, value: linkWeight(rec.value ?? rec.weight ?? rec.strength) });
      } else {
        warnings.push("skipped a link with a missing endpoint");
      }
    }
  }
  return { nodes, links, schema: "nodes + links", warnings };
}

/** array of node objects that carry their own relation fields */
function fromNodeList(arr: unknown[]): ParsedGraph {
  const warnings: string[] = [];
  const nodes: RawNode[] = [];
  const links: RawLink[] = [];
  arr.forEach((item, i) => {
    if (!item || typeof item !== "object") {
      nodes.push({ id: asId(item) ?? `node-${i}` });
      return;
    }
    const rec = item as Record<string, unknown>;
    const id = firstString(rec, idFields);
    if (!id) {
      warnings.push(`item #${i + 1} has no id/name — skipped`);
      return;
    }
    nodes.push({ id, group: firstString(rec, groupFields), value: firstNumber(rec, valueFields) });
    for (const f of linkFields) {
      const rel = rec[f];
      if (!Array.isArray(rel)) continue;
      for (const r of rel) {
        const t = asId(r);
        if (t) links.push({ source: id, target: t, value: linkWeight(r) ?? (typeof r === "object" ? 1 : undefined) });
      }
    }
  });
  return { nodes, links, schema: "node list", warnings };
}

/** { "A": ["B", "C"], "B": [{ target: "D", weight: 3 }] } */
function fromAdjacency(obj: Record<string, unknown>): ParsedGraph {
  const warnings: string[] = [];
  const nodes: RawNode[] = [];
  const links: RawLink[] = [];
  const seen = new Set<string>();
  const ensure = (id: string) => {
    if (!seen.has(id)) {
      seen.add(id);
      nodes.push({ id });
    }
  };
  for (const [key, val] of Object.entries(obj)) {
    if (!Array.isArray(val)) {
      warnings.push(`field "${key}" ignored (expected an array of targets)`);
      continue;
    }
    ensure(key);
    for (const item of val) {
      const t = asId(item);
      if (!t) continue;
      ensure(t);
      links.push({ source: key, target: t, value: linkWeight(item) });
    }
  }
  return { nodes, links, schema: "adjacency map", warnings };
}

/** arbitrary nested object → tree, groups = top-level branches */
function fromNestedTree(obj: Record<string, unknown>): ParsedGraph {
  const nodes: RawNode[] = [];
  const links: RawLink[] = [];
  let counter = 0;

  const addNode = (label: string, group: string | undefined, value?: number) => {
    const id = `${label}__${counter++}`;
    nodes.push({ id, group, value, meta: { label } });
    return id;
  };

  const walk = (label: string, value: unknown, parentId: string | null, group: string | undefined, depth: number) => {
    if (depth > 9) return;
    let id: string;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      id = addNode(label, group);
      if (parentId) links.push({ source: parentId, target: id, value: 2 });
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(k, v, id, group ?? (depth === 0 ? k : undefined), depth + 1);
      }
    } else if (Array.isArray(value)) {
      id = addNode(label, group);
      if (parentId) links.push({ source: parentId, target: id, value: 2 });
      value.forEach((item, i) => {
        if (item !== null && typeof item === "object") {
          const name = firstString(item as Record<string, unknown>, idFields);
          if (name) walk(name, item, id, group, depth + 1);
          else walk(`${label} · ${i + 1}`, item, id, group, depth + 1);
        } else {
          walk(String(item ?? `item-${i + 1}`), item, id, group, depth + 1);
        }
      });
    } else {
      const numeric = typeof value === "number" && Number.isFinite(value) ? value : undefined;
      id = addNode(label, group, numeric);
      if (parentId) links.push({ source: parentId, target: id, value: numeric !== undefined ? Math.max(1, Math.min(6, Math.sqrt(Math.abs(numeric ?? 1)) + 1)) : 1.5 });
    }
  };

  const entries = Object.entries(obj);
  if (entries.length === 1) {
    walk(entries[0][0], entries[0][1], null, undefined, 0);
  } else {
    const rootId = addNode("root", undefined);
    for (const [k, v] of entries) walk(k, v, rootId, k, 1);
  }
  return { nodes, links, schema: "nested tree", warnings: [] };
}

/* ------------------------------------------------------------------ */
/* entry point                                                         */
/* ------------------------------------------------------------------ */

export function convertToGraph(data: unknown): ParsedGraph {
  let parsed: ParsedGraph;

  if (Array.isArray(data)) {
    parsed = fromNodeList(data);
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.nodes)) parsed = fromNodesLinks(obj);
    else {
      const vals = Object.values(obj);
      const arrayShare = vals.length ? vals.filter((v) => Array.isArray(v)).length / vals.length : 0;
      if (vals.length > 0 && arrayShare >= 0.6) parsed = fromAdjacency(obj);
      else if (vals.length > 0 && arrayShare > 0) parsed = fromAdjacency(obj);
      else parsed = fromNestedTree(obj);
    }
  } else {
    throw { message: "Expected a JSON object or array at the top level" } as ParseFailure;
  }

  /* de-duplicate nodes, keep the richest record */
  const byId = new Map<string, RawNode>();
  for (const n of parsed.nodes) {
    const prev = byId.get(n.id);
    if (!prev) byId.set(n.id, n);
    else {
      prev.group = prev.group ?? n.group;
      prev.value = prev.value ?? n.value;
      prev.meta = { ...(n.meta ?? {}), ...(prev.meta ?? {}) };
    }
  }

  /* validate links */
  const links: RawLink[] = [];
  let dangling = 0;
  let selfLoops = 0;
  for (const l of parsed.links) {
    if (!byId.has(l.source) || !byId.has(l.target)) {
      dangling++;
      continue;
    }
    if (l.source === l.target) {
      selfLoops++;
      continue;
    }
    links.push(l);
  }
  const warnings = [...parsed.warnings];
  if (dangling) warnings.push(`${dangling} link${dangling > 1 ? "s" : ""} referenced unknown ids`);
  if (selfLoops) warnings.push(`${selfLoops} self-loop${selfLoops > 1 ? "s" : ""} removed`);

  const nodes = [...byId.values()];
  if (nodes.length === 0) throw { message: "No nodes found — nothing to draw" } as ParseFailure;

  return { nodes, links, schema: parsed.schema, warnings };
}
