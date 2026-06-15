import { useEffect, useState } from "react";
import { BASE, RESULTS_URL, asset } from "../lib/site";

interface Claim {
  id: number;
  claim: string;
  metric: string;
  value: string;
  status: "verified" | "preliminary";
  source: string;
}
interface LayerRow {
  layer: number;
  train_accuracy: number | null;
  test_accuracy: number | null;
}
interface Separability {
  layers: LayerRow[];
  peak_train: { layer: number; accuracy: number };
  peak_test: { layer: number; accuracy: number };
}
interface Figure {
  name: string;
  file: string;
  caption: string;
}

interface SiteData {
  claims: Claim[];
  separability: Separability;
  figures: Figure[];
}

async function loadData(signal: AbortSignal): Promise<SiteData> {
  const get = async (name: string) => {
    const res = await fetch(`${BASE}data/${name}.json`, { signal });
    if (!res.ok) throw new Error(`Missing ${name}.json`);
    return res.json();
  };
  const [claims, separability, figures] = await Promise.all([
    get("claims"),
    get("probe_separability"),
    get("figures"),
  ]);
  return { claims: claims.claims, separability, figures: figures.figures };
}

function ProbeChart({ sep }: { sep: Separability }) {
  const W = 560;
  const H = 240;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxLayer = sep.layers[sep.layers.length - 1].layer;
  const yMin = 0.5;
  const yMax = 1.0;
  const x = (layer: number) => padL + (layer / maxLayer) * plotW;
  const y = (acc: number) => padT + (1 - (acc - yMin) / (yMax - yMin)) * plotH;
  const line = (key: "train_accuracy" | "test_accuracy") =>
    sep.layers
      .filter((r) => r[key] != null)
      .map((r) => `${x(r.layer)},${y(r[key] as number)}`)
      .join(" ");

  const ticks = [0.5, 0.75, 1.0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Probe accuracy by layer">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#1e293b" strokeWidth={1} />
          <text x={4} y={y(t) + 4} fill="#94a3b8" fontSize={11}>
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <polyline points={line("train_accuracy")} fill="none" stroke="#818cf8" strokeWidth={2.5} />
      <polyline points={line("test_accuracy")} fill="none" stroke="#34d399" strokeWidth={2.5} strokeDasharray="4 3" />
      <circle cx={x(sep.peak_train.layer)} cy={y(sep.peak_train.accuracy)} r={4} fill="#818cf8" />
      <text x={x(sep.peak_train.layer)} y={y(sep.peak_train.accuracy) - 8} fill="#c7d2fe" fontSize={11} textAnchor="middle">
        Layer {sep.peak_train.layer}: {Math.round(sep.peak_train.accuracy * 100)}%
      </text>
      {sep.layers.map((r) => (
        <text key={r.layer} x={x(r.layer)} y={H - 8} fill="#64748b" fontSize={10} textAnchor="middle">
          {r.layer}
        </text>
      ))}
      <text x={padL} y={H - 8} fill="#64748b" fontSize={10} textAnchor="middle" />
    </svg>
  );
}

export default function ScoreCards() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    loadData(ctrl.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e.message ?? e));
      });
    return () => ctrl.abort();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-5 text-sm text-amber-200">
        Couldn't load the scored results.{" "}
        <a className="underline" href={RESULTS_URL}>
          Browse them on GitHub
        </a>
        . (Run <code className="rounded bg-slate-800 px-1">npm run data</code> to generate them locally.)
      </div>
    );
  }
  if (!data) {
    return <div className="animate-pulse text-slate-400">Loading verified results…</div>;
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {data.claims.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="text-3xl font-extrabold text-white">{c.value}</div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.status === "verified"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {c.status}
              </span>
            </div>
            <div className="mt-2 font-semibold text-slate-100">{c.claim}</div>
            <div className="mt-1 text-sm text-slate-400">{c.metric}</div>
            <div className="mt-3 font-mono text-xs text-slate-500">{c.source}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-semibold text-white">Probe accuracy by layer</h3>
        <p className="mt-1 text-sm text-slate-400">
          Time-horizon is readable from a single layer and peaks mid-network.{" "}
          <span className="text-indigo-300">— train</span>,{" "}
          <span className="text-emerald-300">- - test</span>
        </p>
        <div className="mt-3">
          <ProbeChart sep={data.separability} />
        </div>
      </div>

      {data.figures.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {data.figures.map((f) => (
            <figure key={f.name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <img
                src={asset(`figures/${f.file}`)}
                alt={f.caption}
                loading="lazy"
                className="rounded bg-white"
              />
              <figcaption className="mt-2 text-xs text-slate-400">{f.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
