import { useEffect, useMemo, useState } from "react";
import { fetchIssues, type Issue } from "../lib/github";
import { ISSUES_URL } from "../lib/site";

const DIFFICULTY_LABEL: Record<string, string> = {
  "good-first": "good first issue",
  intermediate: "intermediate",
  research: "research",
  unlabeled: "untriaged",
};

const THRUSTS = ["foundations", "mechanisms", "robustness", "theory"] as const;

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800 text-slate-300",
    indigo: "bg-indigo-500/15 text-indigo-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    rose: "bg-rose-500/15 text-rose-300",
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export default function IssueBoard() {
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("all");
  const [thrust, setThrust] = useState("all");
  const [track, setTrack] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    fetchIssues(ctrl.signal)
      .then(setIssues)
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e.message ?? e));
      });
    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(() => {
    if (!issues) return [];
    return issues.filter((it) => {
      if (difficulty !== "all" && it.facets.difficulty !== difficulty) return false;
      if (thrust !== "all" && it.facets.thrust !== thrust) return false;
      if (track !== "all" && it.facets.track !== track) return false;
      if (q && !it.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [issues, difficulty, thrust, track, q]);

  const goodFirstCount = issues?.filter((it) => it.facets.difficulty === "good-first").length ?? 0;

  if (error) {
    return (
      <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-5 text-sm text-amber-200">
        {error}{" "}
        <a className="underline" href={ISSUES_URL}>
          Open the issues on GitHub
        </a>
        .
      </div>
    );
  }
  if (!issues) {
    return <div className="animate-pulse text-slate-400">Loading open issues from GitHub…</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-200"
          >
            <option value="all">All</option>
            <option value="good-first">Good first issue</option>
            <option value="intermediate">Intermediate</option>
            <option value="research">Research</option>
            <option value="unlabeled">Untriaged</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Thrust</span>
          <select
            value={thrust}
            onChange={(e) => setThrust(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 capitalize text-slate-200"
          >
            <option value="all">All</option>
            {THRUSTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-400">Track</span>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-200"
          >
            <option value="all">All</option>
            <option value="A">A · probe infra</option>
            <option value="B">B · experiment</option>
          </select>
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-slate-400">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by title…"
            className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 placeholder:text-slate-500"
          />
        </label>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Showing <span className="text-slate-200">{filtered.length}</span> of {issues.length} open issues
        {goodFirstCount > 0 && (
          <>
            {" "}· <span className="text-indigo-300">{goodFirstCount} good first issue{goodFirstCount === 1 ? "" : "s"}</span>
          </>
        )}
      </p>

      <ul className="space-y-3">
        {filtered.map((it) => (
          <li key={it.number} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <a href={it.url} className="font-semibold text-white hover:text-indigo-300">
                  <span className="text-slate-500">#{it.number}</span> {it.title}
                </a>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {it.facets.difficulty === "good-first" && <Badge tone="indigo">good first issue</Badge>}
                  {it.facets.type && <Badge tone="emerald">{it.facets.type}</Badge>}
                  {it.facets.track && <Badge>track {it.facets.track}</Badge>}
                  {it.facets.thrust && <Badge tone="amber">{it.facets.thrust}</Badge>}
                  {it.facets.difficulty !== "good-first" && (
                    <Badge>{DIFFICULTY_LABEL[it.facets.difficulty]}</Badge>
                  )}
                  {it.isDraft && <Badge tone="rose">draft</Badge>}
                </div>
              </div>
              <a
                href={it.url}
                className="shrink-0 rounded bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Claim →
              </a>
            </div>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
          No issues match these filters. Try widening them, or{" "}
          <a className="underline" href={ISSUES_URL}>
            browse all issues
          </a>
          .
        </p>
      )}
    </div>
  );
}
