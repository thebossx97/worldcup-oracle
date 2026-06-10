import { h, render } from 'https://esm.sh/preact@10.23.2';
import { useState, useMemo, useEffect } from 'https://esm.sh/preact@10.23.2/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
import { TEAMS, GROUPS } from './data.js';
import { matchProbabilities, runMonteCarlo, playFullTournament } from './engine.js';

const html = htm.bind(h);
const pct = (x) => (x >= 0.1 ? Math.round(x * 100) : (x * 100).toFixed(1)) + '%';
const byName = Object.fromEntries(TEAMS.map((t) => [t.name, t]));
const N_SIMS = 5000;

// Mapping deutsche Teamnamen → englische Markt-Namen (the-odds-api).
const EN = {
  'Mexiko': 'Mexico', 'Südafrika': 'South Africa', 'Südkorea': 'South Korea', 'Tschechien': 'Czech Republic',
  'Kanada': 'Canada', 'Bosnien-H.': 'Bosnia & Herzegovina', 'Katar': 'Qatar', 'Schweiz': 'Switzerland',
  'Brasilien': 'Brazil', 'Marokko': 'Morocco', 'Haiti': 'Haiti', 'Schottland': 'Scotland',
  'USA': 'USA', 'Paraguay': 'Paraguay', 'Australien': 'Australia', 'Türkei': 'Turkey',
  'Deutschland': 'Germany', 'Curaçao': 'Curaçao', 'Elfenbeinküste': 'Ivory Coast', 'Ecuador': 'Ecuador',
  'Niederlande': 'Netherlands', 'Japan': 'Japan', 'Schweden': 'Sweden', 'Tunesien': 'Tunisia',
  'Belgien': 'Belgium', 'Ägypten': 'Egypt', 'Iran': 'Iran', 'Neuseeland': 'New Zealand',
  'Spanien': 'Spain', 'Kap Verde': 'Cape Verde', 'Saudi-Arabien': 'Saudi Arabia', 'Uruguay': 'Uruguay',
  'Frankreich': 'France', 'Senegal': 'Senegal', 'Irak': 'Iraq', 'Norwegen': 'Norway',
  'Argentinien': 'Argentina', 'Algerien': 'Algeria', 'Österreich': 'Austria', 'Jordanien': 'Jordan',
  'Portugal': 'Portugal', 'DR Kongo': 'DR Congo', 'Usbekistan': 'Uzbekistan', 'Kolumbien': 'Colombia',
  'England': 'England', 'Kroatien': 'Croatia', 'Ghana': 'Ghana', 'Panama': 'Panama',
};

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

  const [market, setMarket] = useState(null);
  useEffect(() => {
    fetch('./src/market.json').then((r) => r.json()).then(setMarket).catch(() => {});
  }, []);
  const mkTitle = (name) => market?.title?.[EN[name]];

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

  // Beste Schätzung = Ensemble aus Modell + Markt — markt-gewichtet (Markt ist nachweislich kalibriert,
  // unser Elo-Modell überkonfident). Das ist die zuverlässigste Antwort auf "wer gewinnt + wie sicher".
  let ensRows = null, champ = null;
  if (market) {
    const raw = rows.map((r) => 0.3 * r.title + 0.7 * (mkTitle(r.name) ?? r.title));
    const sum = raw.reduce((a, b) => a + b, 0) || 1;
    ensRows = rows.map((r, i) => ({ name: r.name, ens: raw[i] / sum })).sort((a, b) => b.ens - a.ens);
    champ = ensRows[0];
  }

  return html`<div>
    ${champ && html`<div class="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-2xl p-5 mb-4 text-center">
      <div class="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Wahrscheinlichster Weltmeister</div>
      <div class="text-3xl font-extrabold mt-1">${byName[champ.name].flag} ${champ.name}</div>
      <div class="text-sm text-white/75 mt-0.5">${pct(champ.ens)} — beste Schätzung (Modell + Markt)</div>
      <div class="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-3 text-xs">
        ${ensRows.slice(1, 5).map((r) => html`<span class="text-white/60">${byName[r.name].flag} ${r.name} ${pct(r.ens)}</span>`)}
      </div>
      <div class="text-[10px] text-white/40 mt-2.5">48-Team-Turnier — weit offen, kein dominanter Favorit. Markt-gewichtet (kalibriert).</div>
    </div>`}
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
      <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Titelchancen · <span class="text-slate-600">Modell</span> vs <span class="text-sky-600">Markt</span></div>
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
          <span class="text-right w-11">
            <span class="block font-extrabold text-sm tabular-nums text-slate-800">${pct(r.title)}</span>
            <span class="block text-[9px] text-slate-400 uppercase tracking-wide">Modell</span>
          </span>
          ${market && html`<span class="text-right w-11">
            <span class="block font-bold text-sm tabular-nums text-sky-600">${mkTitle(r.name) != null ? pct(mkTitle(r.name)) : '–'}</span>
            <span class="block text-[9px] text-slate-400 uppercase tracking-wide">Markt</span>
          </span>`}
        </div>`;
      })}
    </div>
    <p class="text-[11px] text-slate-400 mt-3 leading-snug">
      <b class="text-slate-600">Modell</b> = ${N_SIMS.toLocaleString('de-DE')} Monte-Carlo-Sims (Elo→Poisson).
      <b class="text-sky-600">Markt</b> = echte Buchmacher-Quoten (the-odds-api, entviggt) — die kalibrierte
      Referenz. Wo das Modell deutlich höher liegt (z.B. Spanien/Argentinien), ist es <i>überkonfident</i>:
      der Markt verteilt breiter, weil im 48-Team-K.o. selbst der Favorit weit von sicher ist. Wahrscheinlichkeiten,
      keine Garantie.
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
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Erwartetes Ergebnis</div>
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
  const [open, setOpen] = useState('A');
  return html`<div>
    <p class="text-[11px] text-slate-400 mb-3 leading-snug">
      Prognose je Gruppenspiel — Sieg/Remis/Niederlage-Wahrscheinlichkeit + erwartetes Ergebnis. Tippe eine Gruppe an.
    </p>
    <div class="space-y-2">
      ${GROUPS.map((g) => {
        const isO = open === g.name;
        const teams = g.teams;
        const fx = [];
        for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++) fx.push([teams[i], teams[j]]);
        return html`<div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <button onClick=${() => setOpen(isO ? null : g.name)} class="w-full flex items-center gap-2 p-3 text-left">
            <span class="font-bold text-sm text-slate-700 whitespace-nowrap">Gruppe ${g.name}</span>
            <span class="flex-1 text-sm text-slate-400 truncate text-right">${[...teams].sort((a, b) => b.elo - a.elo).map((t) => t.flag).join(' ')}</span>
            <span class=${'text-slate-400 text-xs transition-transform ' + (isO ? 'rotate-180' : '')}>▾</span>
          </button>
          ${isO && html`<div class="px-3 pb-3 space-y-2.5 border-t border-slate-50 pt-2.5">
            ${fx.map(([a, b]) => {
              const p = matchProbabilities(a, b);
              return html`<div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-700 truncate">${a.flag} ${a.name}</span>
                  <span class="text-slate-500 font-bold px-1 whitespace-nowrap">${p.likely}</span>
                  <span class="font-bold text-slate-700 truncate text-right">${b.name} ${b.flag}</span>
                </div>
                <div class="flex h-4 rounded overflow-hidden text-[9px] font-bold text-white">
                  <div class="bg-emerald-500 grid place-items-center" style=${{ width: `${p.win * 100}%` }}>${Math.round(p.win * 100)}</div>
                  <div class="bg-slate-300 grid place-items-center text-slate-600" style=${{ width: `${p.draw * 100}%` }}>${Math.round(p.draw * 100)}</div>
                  <div class="bg-sky-500 grid place-items-center" style=${{ width: `${p.loss * 100}%` }}>${Math.round(p.loss * 100)}</div>
                </div>
              </div>`;
            })}
          </div>`}
        </div>`;
      })}
    </div>
    <p class="text-[11px] text-slate-400 mt-4 leading-snug">
      <b>Methodik:</b> Modell = Elo-Ratings (ergebnis-basierte Mannschaftsstärke) → erwartete Tore (Poisson) →
      Spielausgang. Elo bildet die Teamstärke aus realen Ergebnissen ab — aber kein Modell kennt Verletzungen,
      Aufstellung oder Tagesform. Wahrscheinlichkeiten, keine Garantie.
    </p>
  </div>`;
}

// ── Turnier-Durchlauf (ein konkreter Verlauf, alle Spiele in Reihenfolge) ──
function PlaythroughTab() {
  const [r, setR] = useState(null);
  const roll = () => setR(playFullTournament());
  useEffect(() => { roll(); }, []);
  if (!r) return html`<div class="py-10 text-center text-slate-400">…</div>`;
  const champ = byName[r.champion.name];
  const Score = ({ m, ko }) => {
    const winA = ko ? m.w === m.a : m.ga > m.gb;
    const winB = ko ? m.w === m.b : m.gb > m.ga;
    return html`<div class="flex items-center gap-2 text-sm py-1">
      <span class=${'flex-1 text-right truncate ' + (winA ? 'font-bold text-slate-800' : 'text-slate-500')}>${m.a.name} ${m.a.flag}</span>
      <span class="font-extrabold tabular-nums text-slate-800 px-1 whitespace-nowrap">${m.ga}:${m.gb}${m.pens ? ' i.E.' : ''}</span>
      <span class=${'flex-1 truncate ' + (winB ? 'font-bold text-slate-800' : 'text-slate-500')}>${m.b.flag} ${m.b.name}</span>
    </div>`;
  };
  return html`<div>
    <div class="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-5 mb-2 text-center">
      <div class="text-xs font-bold uppercase tracking-widest text-white/70">Simulierter Weltmeister</div>
      <div class="text-3xl font-extrabold mt-1">${champ.flag} ${r.champion.name}</div>
      <button onClick=${roll} class="mt-3 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-1.5 text-sm font-bold">↻ neu auslosen</button>
    </div>
    <p class="text-[11px] text-slate-400 mb-4 leading-snug">
      Eine <b>mögliche</b> Simulation (zufällig nach den Wahrscheinlichkeiten) — nicht „die" Vorhersage.
      Die belastbare Prognose sind die Titelchancen im Turnier-Tab.
    </p>

    <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">K.o.-Phase</div>
    ${r.knockout.map((rd) => html`<div class="bg-white rounded-xl border border-slate-100 p-3 mb-2">
      <div class="text-[11px] font-bold text-emerald-600 mb-1">${rd.round}</div>
      ${rd.matches.map((m) => html`<${Score} m=${m} ko=${true} />`)}
    </div>`)}

    <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 mt-4">Gruppen-Endstände</div>
    <div class="grid grid-cols-2 gap-2">
      ${r.groups.map((g) => html`<div class="bg-white rounded-xl border border-slate-100 p-2.5">
        <div class="text-[11px] font-bold text-slate-400 mb-1">Gruppe ${g.name}</div>
        ${g.table.map((row, i) => html`<div class=${'flex items-center justify-between text-xs py-0.5 ' + (i < 2 ? 'font-bold text-slate-800' : i === 2 ? 'text-slate-600' : 'text-slate-400')}>
          <span class="truncate min-w-0"><span class="text-slate-300 mr-1">${i + 1}</span>${row.t.flag} ${row.t.name}</span>
          <span class="tabular-nums ml-1">${row.P}</span>
        </div>`)}
      </div>`)}
    </div>
    <p class="text-[11px] text-slate-400 mt-2">Top 2 (fett) + 8 beste Dritte ziehen in die Runde der 32 ein.</p>
  </div>`;
}

function App() {
  const [tab, setTab] = useState('tournament');
  const tabs = [['tournament', '🏆 Turnier'], ['play', '🎬 Durchlauf'], ['match', '⚔️ Spiel'], ['groups', '📋 Gruppen']];
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
      ${tab === 'play' && html`<${PlaythroughTab} />`}
      ${tab === 'match' && html`<${MatchTab} />`}
      ${tab === 'groups' && html`<${GroupsTab} />`}
    </main>
    <nav class="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200">
      <div class="max-w-2xl mx-auto grid grid-cols-4">
        ${tabs.map(([id, l]) => html`<button onClick=${() => setTab(id)}
          class=${'py-3 text-sm font-bold ' + (tab === id ? 'text-slate-900 border-t-2 border-emerald-400 -mt-px' : 'text-slate-400')}>${l}</button>`)}
      </div>
    </nav>
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
