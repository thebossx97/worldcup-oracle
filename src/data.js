// WorldCup Oracle — ECHTE WM-2026-Auslosung (Final Draw 5. Dez 2025 + Playoffs März 2026).
// 48 Teams, 12 Gruppen A–L. Quelle Gruppen: FIFA / Wikipedia (2026 FIFA World Cup draw).
// Elo-Ratings: echte Werte fuer die Top 20 (eloratings.net via Wikipedia, Stand 1.6.2026),

export const TEAMS = [
  // Gruppe A
  { name: 'Mexiko', flag: '🇲🇽', elo: 1868, group: 'A', host: true },
  { name: 'Südafrika', flag: '🇿🇦', elo: 1700, group: 'A' },
  { name: 'Südkorea', flag: '🇰🇷', elo: 1790, group: 'A' },
  { name: 'Tschechien', flag: '🇨🇿', elo: 1810, group: 'A' },
  // Gruppe B
  { name: 'Kanada', flag: '🇨🇦', elo: 1770, group: 'B', host: true },
  { name: 'Bosnien-H.', flag: '🇧🇦', elo: 1740, group: 'B' },
  { name: 'Katar', flag: '🇶🇦', elo: 1685, group: 'B' },
  { name: 'Schweiz', flag: '🇨🇭', elo: 1894, group: 'B' },
  // Gruppe C
  { name: 'Brasilien', flag: '🇧🇷', elo: 1988, group: 'C' },
  { name: 'Marokko', flag: '🇲🇦', elo: 1855, group: 'C' },
  { name: 'Haiti', flag: '🇭🇹', elo: 1565, group: 'C' },
  { name: 'Schottland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', elo: 1800, group: 'C' },
  // Gruppe D
  { name: 'USA', flag: '🇺🇸', elo: 1790, group: 'D', host: true },
  { name: 'Paraguay', flag: '🇵🇾', elo: 1720, group: 'D' },
  { name: 'Australien', flag: '🇦🇺', elo: 1720, group: 'D' },
  { name: 'Türkei', flag: '🇹🇷', elo: 1906, group: 'D' },
  // Gruppe E
  { name: 'Deutschland', flag: '🇩🇪', elo: 1925, group: 'E' },
  { name: 'Curaçao', flag: '🇨🇼', elo: 1550, group: 'E' },
  { name: 'Elfenbeinküste', flag: '🇨🇮', elo: 1730, group: 'E' },
  { name: 'Ecuador', flag: '🇪🇨', elo: 1935, group: 'E' },
  // Gruppe F
  { name: 'Niederlande', flag: '🇳🇱', elo: 1961, group: 'F' },
  { name: 'Japan', flag: '🇯🇵', elo: 1906, group: 'F' },
  { name: 'Schweden', flag: '🇸🇪', elo: 1815, group: 'F' },
  { name: 'Tunesien', flag: '🇹🇳', elo: 1690, group: 'F' },
  // Gruppe G
  { name: 'Belgien', flag: '🇧🇪', elo: 1866, group: 'G' },
  { name: 'Ägypten', flag: '🇪🇬', elo: 1760, group: 'G' },
  { name: 'Iran', flag: '🇮🇷', elo: 1810, group: 'G' },
  { name: 'Neuseeland', flag: '🇳🇿', elo: 1560, group: 'G' },
  // Gruppe H
  { name: 'Spanien', flag: '🇪🇸', elo: 2165, group: 'H' },
  { name: 'Kap Verde', flag: '🇨🇻', elo: 1620, group: 'H' },
  { name: 'Saudi-Arabien', flag: '🇸🇦', elo: 1620, group: 'H' },
  { name: 'Uruguay', flag: '🇺🇾', elo: 1892, group: 'H' },
  // Gruppe I
  { name: 'Frankreich', flag: '🇫🇷', elo: 2081, group: 'I' },
  { name: 'Senegal', flag: '🇸🇳', elo: 1866, group: 'I' },
  { name: 'Irak', flag: '🇮🇶', elo: 1640, group: 'I' },
  { name: 'Norwegen', flag: '🇳🇴', elo: 1917, group: 'I' },
  // Gruppe J
  { name: 'Argentinien', flag: '🇦🇷', elo: 2113, group: 'J' },
  { name: 'Algerien', flag: '🇩🇿', elo: 1770, group: 'J' },
  { name: 'Österreich', flag: '🇦🇹', elo: 1790, group: 'J' },
  { name: 'Jordanien', flag: '🇯🇴', elo: 1630, group: 'J' },
  // Gruppe K
  { name: 'Portugal', flag: '🇵🇹', elo: 1984, group: 'K' },
  { name: 'DR Kongo', flag: '🇨🇩', elo: 1720, group: 'K' },
  { name: 'Usbekistan', flag: '🇺🇿', elo: 1660, group: 'K' },
  { name: 'Kolumbien', flag: '🇨🇴', elo: 1977, group: 'K' },
  // Gruppe L
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', elo: 2020, group: 'L' },
  { name: 'Kroatien', flag: '🇭🇷', elo: 1930, group: 'L' },
  { name: 'Ghana', flag: '🇬🇭', elo: 1700, group: 'L' },
  { name: 'Panama', flag: '🇵🇦', elo: 1660, group: 'L' },
];

export const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const GROUPS = GROUP_NAMES.map((g) => ({
  name: g,
  teams: TEAMS.filter((t) => t.group === g),
}));

// Gruppenspiele: jeder gegen jeden (6 pro Gruppe).
export function groupFixtures(teams) {
  const f = [];
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++) f.push([teams[i], teams[j]]);
  return f;
}
