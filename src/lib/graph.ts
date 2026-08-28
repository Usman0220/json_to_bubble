import type { ParsedGraph } from "./parse";

export interface SimNode {
  id: string;
  label: string;
  group: string;
  color: string;
  value: number;
  degree: number;
  /** radius when sized by value */
  rVal: number;
  /** radius when sized by connections */
  rDeg: number;
  meta?: Record<string, unknown>;
}

export interface SimLink {
  source: string;
  target: string;
  value: number;
  width: number;
  speed: number;
}

export interface GroupInfo {
  name: string;
  color: string;
  count: number;
}

export interface EnrichedGraph {
  nodes: SimNode[];
  links: SimLink[];
  groups: GroupInfo[];
  maxDegree: number;
}

/* Curated categorical palette — reads well on deep ink navy */
export const PALETTE = [
  "#5eead4", // teal
  "#fbbf24", // amber
  "#60a5fa", // sky
  "#fb7185", // coral rose
  "#a3e635", // lime
  "#f97316", // ember orange
  "#22d3ee", // cyan
  "#d6b98c", // sand
  "#86efac", // mint
  "#f472b6", // blossom
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function buildEnriched(parsed: ParsedGraph): EnrichedGraph {
  const degree = new Map<string, number>();
  for (const l of parsed.links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }

  const groupIndex = new Map<string, number>();
  const groups: GroupInfo[] = [];
  const colorOf = (g: string) => {
    let i = groupIndex.get(g);
    if (i === undefined) {
      i = groups.length % PALETTE.length;
      groupIndex.set(g, i);
      groups.push({ name: g, color: PALETTE[i], count: 0 });
    }
    return PALETTE[i];
  };

  const values = parsed.nodes.map((n) => n.value ?? 0);
  const maxVal = Math.max(1, ...values);
  const maxDegree = Math.max(1, ...[...degree.values()]);

  const nodes: SimNode[] = parsed.nodes.map((n) => {
    const group = n.group ?? "ungrouped";
    const color = colorOf(group);
    const d = degree.get(n.id) ?? 0;
    const g = groups[groupIndex.get(group)!];
    g.count++;
    const v = n.value ?? 0;
    const rVal = clamp(3 + Math.sqrt(Math.max(0.4, v / maxVal)) * 8.5, 3, 13);
    const rDeg = clamp(3 + Math.sqrt(Math.max(0.4, d / maxDegree)) * 8.5, 3, 13);
    return {
      id: n.id,
      label: (n.meta?.label as string) ?? n.id,
      group,
      color,
      value: v,
      degree: d,
      rVal: d === 0 && v === 0 ? 3 : rVal,
      rDeg,
      meta: n.meta,
    };
  });

  const linkVals = parsed.links.map((l) => l.value ?? 1);
  const maxLink = Math.max(1, ...linkVals);

  const links: SimLink[] = parsed.links.map((l) => ({
    source: l.source,
    target: l.target,
    value: l.value ?? 1,
    width: clamp(0.6 + Math.sqrt((l.value ?? 1) / maxLink) * 2.2, 0.6, 3.2),
    speed: 0.0028 + ((l.value ?? 1) / maxLink) * 0.004,
  }));

  return { nodes, links, groups, maxDegree };
}
