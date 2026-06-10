# WorldCup Oracle 🏆

Elo-basierte Prognose-Engine für die WM 2026 (48 Teams, 12 Gruppen).

- **Einzelspiel-Prognose:** zwei Teams wählen → Sieg/Remis/Niederlage-Wahrscheinlichkeiten, wahrscheinlichstes Ergebnis, erwartete Tore (Elo → Poisson).
- **Turnier-Simulation:** 5.000 Monte-Carlo-Durchläufe des kompletten Turniers (Gruppen → beste Dritte → K.o.) → Titelchancen-Ranking, Favorit, Dark Horse, Achtelfinal-Chancen je Team.
- **Gruppen:** alle 12 Gruppen mit Elo-Ratings.

**Modell:** Elo-Ratings → erwartete Tore (Poisson) → W/D/L. Monte-Carlo fürs Turnier. Wahrscheinlichkeiten, keine Garantie — Aufstellung & Ratings kuratiert, keine Live-Daten.

## Tech
Preact + htm + Tailwind (CDN, kein Build). Engine in `src/engine.js`, Daten in `src/data.js`.

## Lokal
```bash
python3 -m http.server 8098   # → http://localhost:8098
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
