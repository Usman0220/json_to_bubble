import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphHandle, GraphSettings } from "./components/GraphCanvas";
import { JsonDock } from "./components/JsonDock";
import { DetailsPanel } from "./components/DetailsPanel";
import { convertToGraph, parseJson, type ParseFailure, type ParsedGraph } from "./lib/parse";
import { buildEnriched, type SimNode } from "./lib/graph";
import { SAMPLES } from "./lib/samples";
import { IconBolt, IconCrosshair, IconLayers, IconLink, IconNodes, IconOrbit, IconPanel, IconTag, IconX } from "./components/icons";

const GraphCanvas = lazy(() => import("./components/GraphCanvas"));

function EngineLoader() {
  return (
    <div className="absolute inset-0 z-0 grid place-items-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border border-teal/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal [animation-duration:1.1s]" />
          <div className="absolute inset-2.5 animate-spin rounded-full border border-transparent border-b-amber/80 [animation-direction:reverse] [animation-duration:1.8s]" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-2 w-2 animate-pulse rounded-full bg-teal shadow-[0_0_18px_rgba(94,234,212,0.9)]" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-fog/80">booting render engine</p>
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-fog/40">three.js · force graph</p>
        </div>
      </div>
    </div>
  );
}

interface Model {
  parsed: ParsedGraph | null;
}

function initialModel(): Model {
  try {
    return { parsed: convertToGraph(parseJson(SAMPLES[0].text)) };
  } catch {
    return { parsed: null };
  }
}

interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "err";
}

export default function App() {
  const [rawText, setRawText] = useState(SAMPLES[0].text);
  const [model, setModel] = useState<Model>(initialModel);
  const [error, setError] = useState<ParseFailure | null>(null);
  const [activeSample, setActiveSample] = useState<string | null>(SAMPLES[0].key);
  const [tab, setTab] = useState<"data" | "tuning">("data");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<SimNode | null>(null);
  const [dockOpen, setDockOpen] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [settings, setSettings] = useState<GraphSettings>({
    sizeMode: "value",
    linkDistance: 72,
    repulsion: 130,
    labels: true,
    orbit: true,
    particles: true,
  });
  const sizeTouched = useRef(false);

  const canvasRef = useRef<GraphHandle>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>(0);

  const enriched = useMemo(() => (model.parsed ? buildEnriched(model.parsed) : null), [model]);
  const selectedNode = useMemo(
    () => (enriched && selectedId ? enriched.nodes.find((n) => n.id === selectedId) ?? null : null),
    [enriched, selectedId]
  );

  const showToast = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), msg, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* ------------------------- render / format ------------------------- */

  const renderGraph = useCallback(
    (text: string, opts?: { silent?: boolean; fromSample?: string | null }) => {
      try {
        const data = parseJson(text);
        const parsed = convertToGraph(data);
        setModel({ parsed });
        setError(null);
        setSelectedId(null);
        if (opts?.fromSample !== undefined) setActiveSample(opts.fromSample);
        setFlashKey(Date.now());
        const hasValues = parsed.nodes.some((n) => (n.value ?? 0) > 0);
        if (!sizeTouched.current && !hasValues) {
          setSettings((s) => ({ ...s, sizeMode: "degree" }));
        }
        if (!opts?.silent) {
          showToast(`Synced · ${parsed.nodes.length} bubbles · ${parsed.links.length} relations`);
        }
      } catch (e) {
        const fail = e as ParseFailure;
        setError(fail.message ? fail : { message: "Could not read that JSON" });
        showToast(fail.message ?? "Invalid JSON", "err");
      }
    },
    [showToast]
  );

  const formatJson = useCallback(() => {
    try {
      const pretty = JSON.stringify(parseJson(rawText), null, 2);
      setRawText(pretty);
      showToast("JSON tidied");
    } catch (e) {
      const fail = e as ParseFailure;
      setError(fail.message ? fail : { message: "Cannot tidy — JSON is invalid" });
      showToast("Cannot tidy invalid JSON", "err");
    }
  }, [rawText, showToast]);

  const loadSample = useCallback(
    (key: string) => {
      const s = SAMPLES.find((x) => x.key === key);
      if (!s) return;
      setRawText(s.text);
      renderGraph(s.text, { fromSample: key });
    },
    [renderGraph]
  );

  const patchSettings = useCallback((s: GraphSettings) => {
    setSettings((prev) => {
      if (s.sizeMode !== prev.sizeMode) sizeTouched.current = true;
      return s;
    });
  }, []);

  /* --------------------------- interactions -------------------------- */

  const focusNode = useCallback((id: string) => {
    setSelectedId(id);
    canvasRef.current?.flyToNode(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stats = enriched
    ? [
        { icon: <IconNodes size={13} />, label: "bubbles", value: enriched.nodes.length },
        { icon: <IconLink size={13} />, label: "relations", value: enriched.links.length },
        { icon: <IconLayers size={13} />, label: "clusters", value: enriched.groups.length },
      ]
    : [];

  return (
    <div className="flex h-full w-full overflow-hidden bg-ink">
      {/* ------------------------------ dock ------------------------------ */}
      <div
        className={`relative z-40 h-full w-[378px] max-w-[92vw] shrink-0 transition-transform duration-300 ease-out max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-[24px_0_80px_rgba(0,0,0,0.6)] ${
          dockOpen ? "translate-x-0" : "max-md:-translate-x-full md:w-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        {dockOpen && (
          <JsonDock
            rawText={rawText}
            onText={(t) => {
              setRawText(t);
              if (activeSample) setActiveSample(null);
            }}
            onRender={() => renderGraph(rawText)}
            onFormat={formatJson}
            error={error}
            parsed={model.parsed}
            activeSample={activeSample}
            onLoadSample={loadSample}
            settings={settings}
            onSettings={patchSettings}
            tab={tab}
            onTab={setTab}
          />
        )}
        {dockOpen && (
          <button
            type="button"
            onClick={() => setDockOpen(false)}
            title="Collapse console"
            className="bf-btn absolute -right-3 top-1/2 z-50 -translate-y-1/2 rounded-r-lg border border-l-0 border-line-2 bg-panel px-1 py-3 text-fog shadow-[6px_0_18px_rgba(0,0,0,0.35)] hover:text-teal"
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2 2 7l5 5" />
            </svg>
          </button>
        )}
      </div>

      {/* ----------------------------- stage ------------------------------ */}
      <div
        className="relative min-w-0 flex-1"
        onPointerMove={(e) => {
          const t = tooltipRef.current;
          if (!t) return;
          const r = e.currentTarget.getBoundingClientRect();
          const x = Math.min(e.clientX - r.left + 18, r.width - 230);
          const y = Math.min(e.clientY - r.top + 16, r.height - 90);
          t.style.transform = `translate(${x}px, ${y}px)`;
        }}
      >
        <Suspense fallback={<EngineLoader />}>
          <GraphCanvas
            ref={canvasRef}
            nodes={enriched?.nodes ?? []}
            links={enriched?.links ?? []}
            settings={settings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onHover={setHoverNode}
          />
        </Suspense>

        {/* ambient overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(1100px_640px_at_18%_-8%,rgba(94,234,212,0.07),transparent_60%),radial-gradient(900px_600px_at_105%_110%,rgba(251,191,36,0.06),transparent_55%),radial-gradient(closest-side,transparent_62%,rgba(3,6,12,0.55)_100%)]" />
        {flashKey > 0 && (
          <div key={flashKey} className="bf-anim-flash pointer-events-none absolute inset-0 z-10 rounded-none" />
        )}

        {/* dock toggle (when closed) */}
        {!dockOpen && (
          <button
            type="button"
            onClick={() => setDockOpen(true)}
            className="bf-btn absolute left-3 top-3 z-30 flex items-center gap-2 rounded-lg border border-line-2 bg-panel/90 px-3 py-2 text-[12px] font-semibold text-fog backdrop-blur hover:text-teal"
          >
            <IconPanel size={15} />
            Console
          </button>
        )}


        {/* stats */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-1.5 max-md:left-3 max-md:top-14">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bf-chip flex items-center gap-2 rounded-lg border border-line bg-panel/85 px-2.5 py-1.5 backdrop-blur"
            >
              <span className="text-teal">{s.icon}</span>
              <span className="font-display text-[13px] font-bold leading-none text-snow">{s.value}</span>
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-fog-2">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* view controls */}
        <div className="absolute right-3 top-3 z-30 flex gap-1.5">
          <button
            type="button"
            title="Toggle auto-orbit"
            onClick={() => patchSettings({ ...settings, orbit: !settings.orbit })}
            className={`bf-btn rounded-lg border p-2.5 backdrop-blur ${
              settings.orbit
                ? "border-teal/60 bg-teal/15 text-teal shadow-[0_0_16px_rgba(94,234,212,0.25)]"
                : "border-line bg-panel/85 text-fog hover:text-snow"
            }`}
          >
            <IconOrbit size={16} />
          </button>
          <button
            type="button"
            title="Toggle labels"
            onClick={() => patchSettings({ ...settings, labels: !settings.labels })}
            className={`bf-btn rounded-lg border p-2.5 backdrop-blur ${
              settings.labels
                ? "border-teal/60 bg-teal/15 text-teal shadow-[0_0_16px_rgba(94,234,212,0.25)]"
                : "border-line bg-panel/85 text-fog hover:text-snow"
            }`}
          >
            <IconTag size={16} />
          </button>
          <button
            type="button"
            title="Reset camera"
            onClick={() => canvasRef.current?.resetView()}
            className="bf-btn rounded-lg border border-line bg-panel/85 p-2.5 text-fog backdrop-blur hover:border-amber/60 hover:text-amber"
          >
            <IconCrosshair size={16} />
          </button>
        </div>

        {/* legend */}
        {enriched && enriched.groups.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[240px]">
            <div className="rounded-lg border border-line bg-panel/85 px-3 py-2.5 backdrop-blur">
              <div className="mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-fog-2">
                Clusters
              </div>
              <ul className="space-y-1">
                {[...enriched.groups]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((g) => (
                    <li key={g.name} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: g.color, boxShadow: `0 0 7px ${g.color}99` }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-fog">
                        {g.name}
                      </span>
                      <span className="font-mono text-[10.5px] text-fog-2">{g.count}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* hint */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 md:flex">
          {[
            ["drag", "orbit"],
            ["scroll", "zoom"],
            ["click", "inspect"],
            ["esc", "release"],
          ].map(([k, v]) => (
            <span
              key={k}
              className="rounded-full border border-line bg-panel/80 px-2.5 py-1 font-mono text-[10px] text-fog-2 backdrop-blur"
            >
              <span className="text-fog">{k}</span> · {v}
            </span>
          ))}
        </div>

        {/* tooltip */}
        <div
          ref={tooltipRef}
          className={`pointer-events-none absolute left-0 top-0 z-30 w-[210px] transition-opacity duration-150 ${
            hoverNode ? "opacity-100" : "opacity-0"
          }`}
        >
          {hoverNode && (
            <div className="rounded-lg border border-line-2 bg-panel/95 px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: hoverNode.color, boxShadow: `0 0 8px ${hoverNode.color}` }}
                />
                <span className="truncate text-[13px] font-bold text-snow">{hoverNode.label}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-fog-2">
                <span style={{ color: hoverNode.color }}>{hoverNode.group}</span>
                <span>·</span>
                <span>{hoverNode.degree} links</span>
                {hoverNode.value > 0 && (
                  <>
                    <span>·</span>
                    <span>val {hoverNode.value}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* details */}
        <DetailsPanel
          node={selectedNode}
          nodes={enriched?.nodes ?? []}
          links={enriched?.links ?? []}
          onFocus={focusNode}
          onClose={() => setSelectedId(null)}
        />

        {/* toast */}
        {toast && (
          <div key={toast.id} className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
            <div
              className={`bf-anim-toast flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[12.5px] font-semibold shadow-[0_14px_44px_rgba(0,0,0,0.55)] backdrop-blur ${
                toast.kind === "ok"
                  ? "border-teal/50 bg-[#0a1f1e]/95 text-teal"
                  : "border-coral/50 bg-[#231116]/95 text-coral"
              }`}
            >
              {toast.kind === "ok" ? <IconBolt size={13} /> : <IconX size={13} />}
              <span className="text-snow">{toast.msg}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
