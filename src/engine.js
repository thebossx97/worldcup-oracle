// WorldCup Oracle — Prognose-Engine: Elo → erwartete Tore (Poisson) → Spiel → Turnier (Monte-Carlo).
import { GROUPS, groupFixtures } from './data.js';

const BASE = 1.35; // mittlere Tore pro Team bei Gleichstand
const DIV = 900; // Elo-Spreizung auf erwartete Tore (höher = weniger extreme Kantersiege)
const CAP = 3.3; // realistische Obergrenze für erwartete Tore eines Teams

// ── ML-Modus: gesetzte Paarungstabelle treibt die GANZE Engine (Gruppen/Spiel/Durchlauf/MC) ──
let ML = null;
export function setMl(pairs) { ML = pairs || null; }
export function mlActive() { return ML !== null; }
function mlWDL(a, b) {
  if (!ML) return null;
  return ML[a.name + '|' + b.name] || null; // [win, draw, loss] aus Sicht a
}

export function expectedGoals(eloA, eloB) {
  const d = (eloA - eloB) / DIV;
  return [Math.min(CAP, BASE * Math.pow(10, d)), Math.min(CAP, BASE * Math.pow(10, -d))];
}

function poissonPMF(lambda, k) {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// Analytische W/D/L-Wahrscheinlichkeiten + wahrscheinlichstes Ergebnis (für Einzelspiel-Prognose).
export function matchProbabilities(a, b) {
  const [la, lb] = expectedGoals(a.elo, b.elo);
  const MAX = 9;
  const pa = [], pb = [];
  for (let k = 0; k < MAX; k++) {
    pa.push(poissonPMF(la, k));
    pb.push(poissonPMF(lb, k));
  }
  let win = 0, draw = 0, loss = 0, best = { ga: 0, gb: 0, p: 0 };
  for (let i = 0; i < MAX; i++)
    for (let j = 0; j < MAX; j++) {
      const p = pa[i] * pb[j];
      if (i > j) win += p; else if (i === j) draw += p; else loss += p;
      if (p > best.p) best = { ga: i, gb: j, p };
    }
  // ML-Modus: W/U/N kommen aus dem trainierten Modell; erwartetes Ergebnis (Elo-Tore) bleibt illustrativ.
  const ml = mlWDL(a, b);
  if (ml) { win = ml[0]; draw = ml[1]; loss = ml[2]; }
  return { win, draw, loss, la, lb, likely: `${Math.round(la)}:${Math.round(lb)}` };
}

function samplePoisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

// Ein Spiel auslosen. knockout=true → bei Remis Elfmeter (leicht favoriten-gewichtet).
function simMatch(a, b, knockout) {
  const [la, lb] = expectedGoals(a.elo, b.elo);
  let ga = samplePoisson(la), gb = samplePoisson(lb);
  const ml = mlWDL(a, b);
  if (ml) {
    // Ausgang aus dem ML-Modell ziehen; Tore (für GD/Anzeige) aus Elo-Erwartung an den Ausgang angepasst.
    const [w, d] = ml;
    const r = Math.random();
    const outcome = r < w ? 0 : r < w + d ? 1 : 2; // 0 Heim, 1 Remis, 2 Auswärts
    if (outcome === 0 && ga <= gb) ga = gb + 1;
    else if (outcome === 2 && gb <= ga) gb = ga + 1;
    else if (outcome === 1) gb = ga;
    if (knockout && outcome === 1) {
      const pen = w + (1 - w - d) > 0 ? w / (w + ml[2]) : 0.5; // Elfmeter nach ML-Sieg-Anteil
      return Math.random() < pen ? { w: a, l: b, ga, gb, pens: true } : { w: b, l: a, ga, gb, pens: true };
    }
    if (outcome === 0) return { w: a, l: b, ga, gb };
    if (outcome === 2) return { w: b, l: a, ga, gb };
    return { w: null, ga, gb };
  }
  if (knockout && ga === gb) {
    const pen = 0.5 + (a.elo - b.elo) / 4000; // kleiner Favoriten-Edge im Elfmeterschießen
    return Math.random() < pen ? { w: a, l: b, ga, gb, pens: true } : { w: b, l: a, ga, gb, pens: true };
  }
  if (ga > gb) return { w: a, l: b, ga, gb };
  if (gb > ga) return { w: b, l: a, ga, gb };
  return { w: null, ga, gb }; // Gruppenphase: Remis möglich
}

function simGroup(teams) {
  const tab = teams.map((t) => ({ t, P: 0, GF: 0, GA: 0 }));
  const idx = (t) => tab.find((x) => x.t === t);
  for (const [a, b] of groupFixtures(teams)) {
    const r = simMatch(a, b, false);
    idx(a).GF += r.ga; idx(a).GA += r.gb; idx(b).GF += r.gb; idx(b).GA += r.ga;
    if (r.w === a) idx(a).P += 3; else if (r.w === b) idx(b).P += 3; else { idx(a).P++; idx(b).P++; }
  }
  tab.forEach((x) => (x.GD = x.GF - x.GA));
  tab.sort((x, y) => y.P - x.P || y.GD - x.GD || y.GF - x.GF || y.t.elo - x.t.elo);
  return tab; // [1st..4th]
}

// Standard-Setzung für ein 32er-Bracket (Seeds in Bracket-Reihenfolge).
const SEED_ORDER = [1,32,16,17,8,25,9,24,4,29,13,20,5,28,12,21,2,31,15,18,7,26,10,23,3,30,14,19,6,27,11,22];

function knockout(seeds) {
  // seeds: 32 Teams nach Stärke sortiert (Index 0 = stärkster)
  let round = SEED_ORDER.map((s) => seeds[s - 1]);
  const reached = {}; // team.name -> tiefste erreichte Runde (32,16,8,4,2,1)
  const labels = [32, 16, 8, 4, 2, 1];
  let li = 0;
  round.forEach((t) => (reached[t.name] = 32));
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) {
      const r = simMatch(round[i], round[i + 1], true);
      next.push(r.w);
    }
    li++;
    next.forEach((t) => (reached[t.name] = labels[li]));
    round = next;
  }
  return { champion: round[0], reached };
}

// Ein komplettes Turnier simulieren → { champion, reached, groupWinners }
export function simulateTournament() {
  const firsts = [], seconds = [], thirds = [];
  const groupWinners = {};
  for (const g of GROUPS) {
    const tab = simGroup(g.teams);
    firsts.push({ ...tab[0], rankTier: 0 });
    seconds.push({ ...tab[1], rankTier: 1 });
    thirds.push({ ...tab[2], rankTier: 2 });
    groupWinners[tab[0].t.name] = true;
  }
  // 8 beste Gruppendritte
  thirds.sort((x, y) => y.P - x.P || y.GD - x.GD || y.GF - x.GF || y.t.elo - x.t.elo);
  const bestThirds = thirds.slice(0, 8);
  const qualifiers = [...firsts, ...seconds, ...bestThirds];
  // Setzung: nach Tier (1./2./3.) dann Punkte/GD, dann Elo
  qualifiers.sort(
    (x, y) => x.rankTier - y.rankTier || y.P - x.P || y.GD - x.GD || y.t.elo - x.t.elo,
  );
  const seeds = qualifiers.map((q) => q.t);
  const { champion, reached } = knockout(seeds);
  return { champion, reached, groupWinners, qualifiers: seeds };
}

// Ein KONKRETER Turnier-Durchlauf in echter Reihenfolge — alle Spiele mit Ergebnis.
const MD = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]; // Spieltag-Reihenfolge 4er-Gruppe

export function playFullTournament() {
  const groupResults = [];
  const firsts = [], seconds = [], thirds = [];
  for (const g of GROUPS) {
    const teams = g.teams;
    const tab = teams.map((t) => ({ t, P: 0, GF: 0, GA: 0 }));
    const idx = (t) => tab.find((x) => x.t === t);
    const matches = [];
    for (const [i, j] of MD) {
      const a = teams[i], b = teams[j];
      const r = simMatch(a, b, false);
      matches.push({ a, b, ga: r.ga, gb: r.gb });
      idx(a).GF += r.ga; idx(a).GA += r.gb; idx(b).GF += r.gb; idx(b).GA += r.ga;
      if (r.w === a) idx(a).P += 3; else if (r.w === b) idx(b).P += 3; else { idx(a).P++; idx(b).P++; }
    }
    tab.forEach((x) => (x.GD = x.GF - x.GA));
    tab.sort((x, y) => y.P - x.P || y.GD - x.GD || y.GF - x.GF || y.t.elo - x.t.elo);
    groupResults.push({ name: g.name, matches, table: tab });
    firsts.push({ ...tab[0], rankTier: 0 });
    seconds.push({ ...tab[1], rankTier: 1 });
    thirds.push({ ...tab[2], rankTier: 2 });
  }
  thirds.sort((x, y) => y.P - x.P || y.GD - x.GD || y.GF - x.GF || y.t.elo - x.t.elo);
  const bestThirds = thirds.slice(0, 8);
  const qual = [...firsts, ...seconds, ...bestThirds].sort(
    (x, y) => x.rankTier - y.rankTier || y.P - x.P || y.GD - x.GD || y.t.elo - x.t.elo,
  );
  let round = SEED_ORDER.map((s) => qual[s - 1].t);
  const rounds = [];
  const labels = ['Runde der 32', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
  let li = 0;
  while (round.length > 1) {
    const matches = [], next = [];
    for (let i = 0; i < round.length; i += 2) {
      const r = simMatch(round[i], round[i + 1], true);
      matches.push({ a: round[i], b: round[i + 1], ga: r.ga, gb: r.gb, pens: r.pens, w: r.w });
      next.push(r.w);
    }
    rounds.push({ round: labels[li] || 'Runde', matches });
    round = next; li++;
  }
  return { groups: groupResults, knockout: rounds, champion: round[0], bestThirds: bestThirds.map((x) => x.t.name) };
}

// Monte-Carlo: N Turniere → Aggregat je Team.
export function runMonteCarlo(N) {
  const stats = {};
  const init = (name) => (stats[name] = stats[name] || { title: 0, final: 0, semi: 0, quarter: 0, r16: 0, r32: 0, groupWin: 0 });
  for (let n = 0; n < N; n++) {
    const { champion, reached, groupWinners } = simulateTournament();
    for (const name in reached) {
      const s = init(name);
      const r = reached[name];
      if (r <= 32) s.r32++;
      if (r <= 16) s.r16++;
      if (r <= 8) s.quarter++;
      if (r <= 4) s.semi++;
      if (r <= 2) s.final++;
    }
    init(champion.name).title++;
    for (const name in groupWinners) init(name).groupWin++;
  }
  return Object.entries(stats)
    .map(([name, s]) => ({
      name,
      title: s.title / N,
      final: s.final / N,
      semi: s.semi / N,
      quarter: s.quarter / N,
      r16: s.r16 / N,
      advance: s.r32 / N,
      groupWin: s.groupWin / N,
    }))
    .sort((a, b) => b.title - a.title || b.final - a.final || b.advance - a.advance);
}
