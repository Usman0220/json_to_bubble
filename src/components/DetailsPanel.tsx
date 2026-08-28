import type { SimLink, SimNode } from "../lib/graph";
import { IconFocus, IconLink, IconX } from "./icons";

interface Props {
  node: SimNode | null;
  nodes: SimNode[];
  links: SimLink[];
  onFocus: (id: string) => void;
  onClose: () => void;
}

export function DetailsPanel({ node, nodes, links, onFocus, onClose }: Props) {
  if (!node) return null;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighbors: { n: SimNode; w: number; dir: "out" | "in" }[] = [];
  for (const l of links) {
    if (l.source === node.id) {
      const t = byId.get(l.target);
      if (t) neighbors.push({ n: t, w: l.value, dir: "out" });
    } else if (l.target === node.id) {
      const s = byId.get(l.source);
      if (s) neighbors.push({ n: s, w: l.value, dir: "in" });
    }
  }
  neighbors.sort((a, b) => b.w - a.w);
  const maxW = Math.max(1, ...neighbors.map((x) => x.w));
  const share = links.length ? Math.round((neighbors.length / links.length) * 100) : 0;

  return (
    <div className="bf-anim-slide pointer-events-auto absolute bottom-3 right-3 top-14 z-20 flex w-[290px] max-w-[85vw] flex-col overflow-hidden rounded-xl border border-line-2 bg-panel/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      {/* header */}
      <div className="bf-dots flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-fog-2">
          Node detail
        </span>
        <button
          type="button"
          onClick={onClose}
          className="bf-btn rounded-md border border-transparent p-1 text-fog-2 hover:border-line-2 hover:text-snow"
          aria-label="Close details"
        >
          <IconX size={14} />
        </button>
      </div>

      <div className="bf-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 pb-3 pt-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: node.color, boxShadow: `0 0 10px ${node.color}` }}
            />
            <span
              className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider"
              style={{ borderColor: `${node.color}55`, color: node.color, background: `${node.color}14` }}
            >
              {node.group}
            </span>
          </div>
          <h2 className="font-display text-[19px] font-bold leading-tight text-snow">{node.label}</h2>
          {node.id !== node.label && (
            <p className="mt-0.5 truncate font-mono text-[10.5px] text-fog-2">id: {node.id}</p>
          )}
        </div>

        {/* stats */}
        <div className="mx-4 grid grid-cols-3 overflow-hidden rounded-lg border border-line bg-ink-2">
          {[
            { k: "Links", v: String(node.degree) },
            { k: "Value", v: node.value ? String(Math.round(node.value * 100) / 100) : "—" },
            { k: "Share", v: `${share}%` },
          ].map((s, i) => (
            <div
              key={s.k}
              className={`px-2 py-2.5 text-center ${i > 0 ? "border-l border-line" : ""}`}
            >
              <div className="font-display text-[15px] font-bold text-teal">{s.v}</div>
              <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-fog-2">
                {s.k}
              </div>
            </div>
          ))}
        </div>

        {/* neighbors */}
        <div className="px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-fog-2">
              <IconLink size={12} />
              Connected · {neighbors.length}
            </span>
          </div>
          {neighbors.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-fog-2">
              An island — no relations touch this bubble.
            </p>
          ) : (
            <ul className="space-y-1">
              {neighbors.map(({ n, w, dir }) => (
                <li key={n.id + dir}>
                  <button
                    type="button"
                    onClick={() => onFocus(n.id)}
                    className="bf-row group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-line-2 hover:bg-panel-2"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: n.color, boxShadow: `0 0 8px ${n.color}88` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-snow group-hover:text-teal">
                        {n.label}
                      </span>
                      <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-ink-2">
                        <span
                          className="block h-full rounded-full transition-all duration-500"
                          style={{ width: `${(w / maxW) * 100}%`, background: n.color }}
                        />
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-mono text-[11px] font-medium text-fog">{w}</span>
                      <span className="block font-mono text-[8.5px] uppercase text-fog-2">
                        {dir === "out" ? "out →" : "← in"}
                      </span>
                    </span>
                    <span className="shrink-0 text-fog-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <IconFocus size={13} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => onFocus(node.id)}
          className="bf-btn flex w-full items-center justify-center gap-2 rounded-lg border border-amber/50 bg-amber/10 px-3 py-2 text-[12px] font-bold text-amber hover:bg-amber/20"
        >
          <IconFocus size={13} />
          Re-center camera
        </button>
      </div>
    </div>
  );
}
