import { useMemo, useState } from "react";
import type { ParseFailure } from "../lib/parse";
import type { ParsedGraph } from "../lib/parse";
import type { GraphSettings, SizeMode } from "./GraphCanvas";
import { SAMPLES } from "../lib/samples";
import {
  IconAlert,
  IconBolt,
  IconBraces,
  IconChevron,
  IconInfo,
  IconLogo,
  IconParticles,
  IconSliders,
  IconTag,
  IconOrbit,
  IconWand,
} from "./icons";

interface Props {
  rawText: string;
  onText: (t: string) => void;
  onRender: () => void;
  onFormat: () => void;
  error: ParseFailure | null;
  parsed: ParsedGraph | null;
  activeSample: string | null;
  onLoadSample: (key: string) => void;
  settings: GraphSettings;
  onSettings: (s: GraphSettings) => void;
  tab: "data" | "tuning";
  onTab: (t: "data" | "tuning") => void;
}

function fillStyle(min: number, max: number, v: number) {
  return { "--fill": `${((v - min) / (max - min)) * 100}%` } as React.CSSProperties;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">{label}</span>
        <span className="font-mono text-xs font-medium text-teal">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="bf-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={fillStyle(min, max, value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  on,
  icon,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  icon: React.ReactNode;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="bf-row group flex w-full items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-left hover:border-line-2"
    >
      <span className={`shrink-0 ${on ? "text-teal" : "text-fog-2"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-snow">{label}</span>
        <span className="block truncate text-[11px] text-fog-2">{hint}</span>
      </span>
      <span className="bf-switch" data-on={on} aria-hidden />
    </button>
  );
}

export function JsonDock(p: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const charCount = useMemo(() => p.rawText.length, [p.rawText]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-line bg-panel">
      {/* wordmark */}
      <div className="bf-dots flex items-center gap-3 border-b border-line px-4 py-3.5">
        <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-line-2 bg-ink-2">
          <IconLogo size={24} />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-panel bg-teal bf-anim-pulse" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[15px] font-bold leading-tight tracking-wide text-snow">
            BUBBLEFIELD
          </h1>
          <p className="font-mono text-[10.5px] text-fog-2">
            JSON <span className="text-teal">→</span> 3D relation space
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="grid grid-cols-2 border-b border-line">
        {(
          [
            { id: "data", label: "Data", icon: <IconBraces size={14} /> },
            { id: "tuning", label: "Tuning", icon: <IconSliders size={14} /> },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => p.onTab(t.id)}
            className={`relative flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors ${
              p.tab === t.id ? "text-teal" : "text-fog-2 hover:text-fog"
            }`}
          >
            {t.icon}
            {t.label}
            {p.tab === t.id && (
              <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-teal shadow-[0_0_10px_rgba(94,234,212,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {p.tab === "data" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* dataset picker */}
          <div className="border-b border-line px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-fog-2">
                Dataset
              </span>
              {p.parsed && (
                <span className="rounded border border-line-2 bg-ink-2 px-1.5 py-0.5 font-mono text-[10px] text-cyan">
                  {p.parsed.schema}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => p.onLoadSample(s.key)}
                  className={`bf-chip rounded-md border px-2.5 py-1.5 text-left ${
                    p.activeSample === s.key
                      ? "border-teal/60 bg-teal/10 text-teal"
                      : "border-line bg-panel-2 text-fog hover:border-line-2 hover:text-snow"
                  }`}
                >
                  <span className="block truncate text-[12px] font-semibold">{s.name}</span>
                  <span className="block font-mono text-[9.5px] opacity-70">{s.schema}</span>
                </button>
              ))}
            </div>
          </div>

          {/* editor */}
          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
            <div className="flex items-center justify-between pb-1.5">
              <span className="flex items-center gap-2 font-mono text-[11px] text-fog-2">
                <span className="text-teal">▸</span> input.json
                <span className="bf-anim-blink text-teal">▌</span>
              </span>
              <span className="font-mono text-[10px] text-fog-2">{charCount} ch</span>
            </div>
            <div
              className={`relative min-h-0 flex-1 overflow-hidden rounded-lg border bg-ink-2 transition-colors ${
                p.error ? "border-coral/60" : "border-line focus-within:border-teal/50"
              }`}
            >
              <textarea
                className="bf-editor bf-scroll absolute inset-0 h-full w-full bg-transparent p-3 text-snow"
                spellCheck={false}
                value={p.rawText}
                onChange={(e) => p.onText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    p.onRender();
                  }
                }}
                placeholder='Paste JSON… e.g. { "nodes": [...], "links": [...] }'
              />
            </div>

            {/* diagnostics */}
            {p.error && (
              <div className="bf-anim-rise mt-2 flex items-start gap-2.5 rounded-lg border border-coral/50 bg-coral/10 px-3 py-2.5">
                <span className="mt-0.5 text-coral">
                  <IconAlert size={15} />
                </span>
                <div className="min-w-0 text-[12px] leading-snug">
                  <p className="font-semibold text-coral">JSON parse error</p>
                  <p className="text-snow/85">{p.error.message}</p>
                  {p.error.line !== undefined && (
                    <p className="mt-0.5 font-mono text-[10.5px] text-coral/90">
                      line {p.error.line} · col {p.error.col}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!p.error && p.parsed && p.parsed.warnings.length > 0 && (
              <div className="mt-2 rounded-lg border border-amber/40 bg-amber/5 px-3 py-2 text-[11px] leading-snug text-amber/90">
                {p.parsed.warnings.map((w, i) => (
                  <p key={i}>· {w}</p>
                ))}
              </div>
            )}

            {/* actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={p.onRender}
                className="bf-btn flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber px-3 py-2.5 text-[13px] font-bold text-ink shadow-[0_0_22px_rgba(251,191,36,0.25)] hover:bg-[#ffcd4d] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
              >
                <IconBolt size={14} />
                Render graph
                <span className="rounded border border-ink/25 px-1 font-mono text-[9.5px] font-semibold">
                  ⌘↵
                </span>
              </button>
              <button
                type="button"
                onClick={p.onFormat}
                title="Pretty-print JSON"
                className="bf-btn flex items-center gap-2 rounded-lg border border-line-2 bg-panel-2 px-3 py-2.5 text-[13px] font-semibold text-fog hover:border-teal/50 hover:text-teal"
              >
                <IconWand size={14} />
                Tidy
              </button>
            </div>

            {/* format help */}
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="bf-row mt-3 flex items-center justify-between rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12px] font-semibold text-fog hover:text-snow"
            >
              <span className="flex items-center gap-2">
                <span className="text-cyan">
                  <IconInfo size={14} />
                </span>
                Accepted JSON shapes
              </span>
              <span className={`transition-transform duration-300 ${helpOpen ? "rotate-180" : ""}`}>
                <IconChevron size={14} />
              </span>
            </button>
            {helpOpen && (
              <div className="bf-anim-rise mt-1.5 space-y-1.5 rounded-lg border border-line bg-ink-2 p-3 font-mono text-[10.5px] leading-relaxed text-fog">
                <p>
                  <span className="text-teal">1 · nodes + links</span> — classic graph payload
                  <br />
                  <span className="text-snow/75">{'{ "nodes": [{ "id", "group", "value" }],'}</span>
                  <br />
                  <span className="text-snow/75">{'  "links": [{ "source", "target", "value" }] }'}</span>
                </p>
                <p>
                  <span className="text-teal">2 · adjacency map</span> — keys point at targets
                  <br />
                  <span className="text-snow/75">{'{ "A": ["B", { "target": "C", "weight": 3 }] }'}</span>
                </p>
                <p>
                  <span className="text-teal">3 · nested tree</span> — any nested object / array
                  <br />
                  <span className="text-snow/75">{'{ "Root": { "Branch": { "leaf": 42 } } }'}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bf-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* size mode */}
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fog">
              Bubble size
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-ink-2 p-1">
              {(
                [
                  { id: "value", label: "By value" },
                  { id: "degree", label: "By links" },
                ] as { id: SizeMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => p.onSettings({ ...p.settings, sizeMode: m.id })}
                  className={`rounded-md px-2 py-1.5 text-[12px] font-semibold transition-all ${
                    p.settings.sizeMode === m.id
                      ? "bg-teal/15 text-teal shadow-[inset_0_0_0_1px_rgba(94,234,212,0.45)]"
                      : "text-fog-2 hover:text-fog"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Link distance"
            value={p.settings.linkDistance}
            min={30}
            max={170}
            onChange={(v) => p.onSettings({ ...p.settings, linkDistance: v })}
          />
          <Slider
            label="Repulsion"
            value={p.settings.repulsion}
            min={20}
            max={320}
            onChange={(v) => p.onSettings({ ...p.settings, repulsion: v })}
          />

          <div className="space-y-2 pt-1">
            <Toggle
              label="Particle flow"
              hint="Stream pulses along each relation"
              on={p.settings.particles}
              icon={<IconParticles size={16} />}
              onChange={(v) => p.onSettings({ ...p.settings, particles: v })}
            />
            <Toggle
              label="Labels"
              hint="Name tag floating over each bubble"
              on={p.settings.labels}
              icon={<IconTag size={16} />}
              onChange={(v) => p.onSettings({ ...p.settings, labels: v })}
            />
            <Toggle
              label="Auto-orbit"
              hint="Slow drift around the cluster"
              on={p.settings.orbit}
              icon={<IconOrbit size={16} />}
              onChange={(v) => p.onSettings({ ...p.settings, orbit: v })}
            />
          </div>

          <p className="rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[11px] leading-relaxed text-fog-2">
            Physics changes reheat the simulation live — bubbles resettle while you watch. You can
            also grab any bubble in 3D and drag it to a new spot.
          </p>
        </div>
      )}
    </aside>
  );
}
