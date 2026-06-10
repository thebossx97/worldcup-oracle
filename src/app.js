import { h, render } from 'https://esm.sh/preact@10.23.2';
import { useState, useMemo, useEffect } from 'https://esm.sh/preact@10.23.2/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { TEAMS, GROUPS } from './data.js';
import { matchProbabilities, runMonteCarlo } from './engine.js';

const html = htm.bind(h);
const pct = (x) => (x >= 0.1 ? Math.round(x * 100) : (x * 100).toFixed(1)) + '%';
const byName = Object.fromEntries(TEAMS.map((t) => [t.name, t]));
const N_SIMS = 5000;

function Bar({ value, color }) {
  return html`<div class="h-1.5 rounded-full bg-slate-200 overflow-hidden">
    <div class="h-full rounded-full" style=${{ width: `${Math.max(2, value * 100)}%`, background: color }}></div>
  </div>`;
}

// ── Turnier-Prognose (Monte-Carlo) ──────────────────────────────────
function TournamentTab() {
  const [state, setState] = useState({ kind: 'idle' });

  const run = () => {
    setState({ kind: 'running' });
    // UI erst 'simuliere…' zeichnen lassen, dann rechnen.
    setTimeout(() => setState({ kind: 'done', rows: runMonteCarlo(N_SIMS) }), 30);
  };
  useEffect(() => { run(); }, []);

  if (state.kind !== 'done')
    return html`<div class="text-center py-20">
      <div class="text-4xl mb-3 animate-pulse">🎲</div>
      <div class="font-bold text-slate-700">Simuliere ${N_SIMS.toLocaleString('de-DE')} Turniere …</div>
      <div class="text-xs text-slate-400 mt-1">Elo → erwartete Tore (Poisson) → ${N_SIMS.toLocaleString('de-DE')}× komplettes Turnier</div>
    </div>`;

  const rows = state.rows;
  const fav = rows[0];
  const top = byName[fav.name];
  // Dark Horse: bestes Verhältnis Titelchance zu Elo (Überperformer)
  const dark = [...rows].filter((r) => byName[r.name].elo < 1850 && r.advance > 0.4).sort((a, b) => b.semi - a.semi)[0];

  return html`<div>
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Favorit</div>
        <div class="font-extrabold text-slate-800 mt-0.5">${top.flag} ${fav.name}</div>
        <div class="text-xs text-slate-500">${pct(fav.title)} Titelchance</div>
      </div>
      ${dark && html`<div class="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div class="text-[10px] font-bold uppercase tracking-wider text-amber-600">Dark Horse</div>
        <div class="font-extrabold text-slate-800 mt-0.5">${byName[dark.name].flag} ${dark.name}</div>
        <div class="text-xs text-slate-500">${pct(dark.semi)} ins Halbfinale</div>
      </div>`}
    </div>

    <div class="flex items-center justify-between mb-2">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Titelchancen</div>
      <button onClick=${run} class="text-xs font-bold text-emerald-600 hover:underline">↻ neu simulieren</button>
    </div>
    <div class="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
      ${rows.slice(0, 20).map((r, i) => {
        const t = byName[r.name];
        return html`<div class="flex items-center gap-3 px-3 py-2.5">
          <span class="text-xs font-bold text-slate-300 w-5 text-right">${i + 1}</span>
          <span class="text-lg w-6 text-center">${t.flag}</span>
          <span class="flex-1 min-w-0">
            <span class="font-bold text-sm text-slate-800 truncate">${r.name}</span>
            <${Bar} value=${r.title} color="#10b981" />
          </span>
          <span class="text-right">
            <span class="block font-extrabold text-sm tabular-nums text-slate-800">${pct(r.title)}</span>
            <span class="block text-[10px] text-slate-400">Achtelf. ${pct(r.r16)}</span>
          </span>
        </div>`;
      })}
    </div>
    <p class="text-[11px] text-slate-400 mt-3 leading-snug">
      ${N_SIMS.toLocaleString('de-DE')} Monte-Carlo-Simulationen. Wahrscheinlichkeiten, keine Garantie — ein
      Außenseiter kann immer gewinnen. Modell: Elo-Ratings → Poisson-Tore. Aufstellung & Ratings kuratiert.
    </p>
  </div>`;
}

// ── Einzelspiel-Prognose ────────────────────────────────────────────
function MatchTab() {
  const [aN, setAN] = useState('Argentinien');
  const [bN, setBN] = useState('Frankreich');
  const a = byName[aN], b = byName[bN];
  const p = useMemo(() => matchProbabilities(a, b), [aN, bN]);

  const Select = ({ value, onChange }) => html`<select value=${value} onChange=${(e) => onChange(e.target.value)}
    class="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-bold bg-white">
    ${[...TEAMS].sort((x, y) => y.elo - x.elo).map((t) => html`<option value=${t.name}>${t.flag} ${t.name}</option>`)}
  </select>`;

  return html`<div>
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-5">
      <${Select} value=${aN} onChange=${setAN} />
      <span class="text-slate-400 font-bold text-sm">vs</span>
      <${Select} value=${bN} onChange=${setBN} />
    </div>

    <div class="bg-white rounded-2xl border border-slate-100 p-5 mb-3">
      <div class="flex items-end justify-between mb-1 text-sm font-bold">
        <span class="text-emerald-600">${a.flag} Sieg</span>
        <span class="text-slate-400">Remis</span>
        <span class="text-sky-600">Sieg ${b.flag}</span>
      </div>
      <div class="flex h-7 rounded-lg overflow-hidden text-[11px] font-bold text-white">
        <div class="bg-emerald-500 flex items-center justify-center" style=${{ width: `${p.win * 100}%` }}>${pct(p.win)}</div>
        <div class="bg-slate-300 flex items-center justify-center text-slate-700" style=${{ width: `${p.draw * 100}%` }}>${pct(p.draw)}</div>
        <div class="bg-sky-500 flex items-center justify-center" style=${{ width: `${p.loss * 100}%` }}>${pct(p.loss)}</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="bg-white rounded-xl border border-slate-100 p-4 text-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wahrscheinlichstes Ergebnis</div>
        <div class="text-2xl font-extrabold text-slate-800 mt-1">${p.likely}</div>
      </div>
      <div class="bg-white rounded-xl border border-slate-100 p-4 text-center">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Erwartete Tore</div>
        <div class="text-2xl font-extrabold text-slate-800 mt-1">${p.la.toFixed(1)} : ${p.lb.toFixed(1)}</div>
      </div>
    </div>
    <p class="text-[11px] text-slate-400 mt-3">Elo ${a.elo} vs ${b.elo}. Wahrscheinlichkeiten, keine Garantie.</p>
  </div>`;
}

// ── Gruppen ─────────────────────────────────────────────────────────
function GroupsTab() {
  return html`<div class="grid grid-cols-2 gap-2">
    ${GROUPS.map((g) => html`<div class="bg-white rounded-xl border border-slate-100 p-3">
      <div class="text-xs font-bold text-slate-400 mb-1.5">Gruppe ${g.name}</div>
      ${[...g.teams].sort((x, y) => y.elo - x.elo).map((t) => html`<div class="flex items-center justify-between text-sm py-0.5">
        <span class="text-slate-700"><span class="mr-1">${t.flag}</span>${t.name}</span>
        <span class="text-[10px] text-slate-400 tabular-nums">${t.elo}</span>
      </div>`)}
    </div>`)}
  </div>`;
}

function App() {
  const [tab, setTab] = useState('tournament');
  const tabs = [['tournament', '🏆 Turnier'], ['match', '⚔️ Einzelspiel'], ['groups', '📋 Gruppen']];
  return html`<div class="min-h-screen bg-slate-50 text-slate-900 pb-20">
    <header class="bg-slate-900 text-white">
      <div class="max-w-2xl mx-auto px-5 py-4 flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-emerald-400 text-slate-900 grid place-items-center font-black">O</div>
        <div class="font-bold tracking-tight">WorldCup Oracle</div>
        <span class="text-xs text-slate-400 ml-1">WM 2026 · Elo-Prognose</span>
      </div>
    </header>
    <main class="max-w-2xl mx-auto px-5 py-6">
      ${tab === 'tournament' && html`<${TournamentTab} />`}
      ${tab === 'match' && html`<${MatchTab} />`}
      ${tab === 'groups' && html`<${GroupsTab} />`}
    </main>
    <nav class="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200">
      <div class="max-w-2xl mx-auto grid grid-cols-3">
        ${tabs.map(([id, l]) => html`<button onClick=${() => setTab(id)}
          class=${'py-3 text-sm font-bold ' + (tab === id ? 'text-slate-900 border-t-2 border-emerald-400 -mt-px' : 'text-slate-400')}>${l}</button>`)}
      </div>
    </nav>
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
