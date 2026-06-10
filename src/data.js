// WorldCup Oracle — kuratierte WM-2026-Aufstellung (48 Teams, 12 Gruppen).
// Elo-Ratings ~ eloratings.net-Niveau (kuratiert, Stand Auslosung). Keine Live-Daten.
// Format: 12 Gruppen à 4 → Top 2 + 8 beste Gruppendritte → Runde der 32 → K.o.

export const TEAMS = [
  // Gruppe A
  { name: 'USA', flag: '🇺🇸', elo: 1820, group: 'A', host: true },
  { name: 'Schweiz', flag: '🇨🇭', elo: 1865, group: 'A' },
  { name: 'Südkorea', flag: '🇰🇷', elo: 1780, group: 'A' },
  { name: 'Ghana', flag: '🇬🇭', elo: 1640, group: 'A' },
  // Gruppe B
  { name: 'Mexiko', flag: '🇲🇽', elo: 1850, group: 'B', host: true },
  { name: 'Uruguay', flag: '🇺🇾', elo: 1900, group: 'B' },
  { name: 'Ägypten', flag: '🇪🇬', elo: 1700, group: 'B' },
  { name: 'Jordanien', flag: '🇯🇴', elo: 1540, group: 'B' },
  // Gruppe C
  { name: 'Kanada', flag: '🇨🇦', elo: 1765, group: 'C', host: true },
  { name: 'Kroatien', flag: '🇭🇷', elo: 1920, group: 'C' },
  { name: 'Nigeria', flag: '🇳🇬', elo: 1720, group: 'C' },
  { name: 'Neuseeland', flag: '🇳🇿', elo: 1520, group: 'C' },
  // Gruppe D
  { name: 'Argentinien', flag: '🇦🇷', elo: 2095, group: 'D' },
  { name: 'Norwegen', flag: '🇳🇴', elo: 1795, group: 'D' },
  { name: 'Elfenbeinküste', flag: '🇨🇮', elo: 1690, group: 'D' },
  { name: 'Saudi-Arabien', flag: '🇸🇦', elo: 1560, group: 'D' },
  // Gruppe E
  { name: 'Frankreich', flag: '🇫🇷', elo: 2060, group: 'E' },
  { name: 'Senegal', flag: '🇸🇳', elo: 1825, group: 'E' },
  { name: 'Australien', flag: '🇦🇺', elo: 1720, group: 'E' },
  { name: 'Usbekistan', flag: '🇺🇿', elo: 1560, group: 'E' },
  // Gruppe F
  { name: 'Brasilien', flag: '🇧🇷', elo: 2015, group: 'F' },
  { name: 'Kolumbien', flag: '🇨🇴', elo: 1880, group: 'F' },
  { name: 'Kamerun', flag: '🇨🇲', elo: 1685, group: 'F' },
  { name: 'Panama', flag: '🇵🇦', elo: 1560, group: 'F' },
  // Gruppe G
  { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', elo: 1985, group: 'G' },
  { name: 'Ecuador', flag: '🇪🇨', elo: 1785, group: 'G' },
  { name: 'Iran', flag: '🇮🇷', elo: 1720, group: 'G' },
  { name: 'Katar', flag: '🇶🇦', elo: 1610, group: 'G' },
  // Gruppe H
  { name: 'Spanien', flag: '🇪🇸', elo: 2055, group: 'H' },
  { name: 'Marokko', flag: '🇲🇦', elo: 1845, group: 'H' },
  { name: 'Japan', flag: '🇯🇵', elo: 1840, group: 'H' },
  { name: 'Kap Verde', flag: '🇨🇻', elo: 1500, group: 'H' },
  // Gruppe I
  { name: 'Portugal', flag: '🇵🇹', elo: 1990, group: 'I' },
  { name: 'Dänemark', flag: '🇩🇰', elo: 1835, group: 'I' },
  { name: 'Tunesien', flag: '🇹🇳', elo: 1655, group: 'I' },
  { name: 'Curaçao', flag: '🇨🇼', elo: 1485, group: 'I' },
  // Gruppe J
  { name: 'Niederlande', flag: '🇳🇱', elo: 1980, group: 'J' },
  { name: 'Österreich', flag: '🇦🇹', elo: 1835, group: 'J' },
  { name: 'Algerien', flag: '🇩🇿', elo: 1720, group: 'J' },
  { name: 'Honduras', flag: '🇭🇳', elo: 1520, group: 'J' },
  // Gruppe K
  { name: 'Belgien', flag: '🇧🇪', elo: 1935, group: 'K' },
  { name: 'Türkei', flag: '🇹🇷', elo: 1800, group: 'K' },
  { name: 'Paraguay', flag: '🇵🇾', elo: 1700, group: 'K' },
  { name: 'Jamaika', flag: '🇯🇲', elo: 1540, group: 'K' },
  // Gruppe L
  { name: 'Deutschland', flag: '🇩🇪', elo: 1950, group: 'L' },
  { name: 'Schottland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', elo: 1760, group: 'L' },
  { name: 'Mali', flag: '🇲🇱', elo: 1660, group: 'L' },
  { name: 'Costa Rica', flag: '🇨🇷', elo: 1625, group: 'L' },
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
