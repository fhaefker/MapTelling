# MapTelling Refactor & Optimization Backlog

Quelle: Abgleich gegen `MAPCOMPONENTS_CAPABILITIES.md` (Abschnitte 0–87). Ziel: Projekt MapTelling näher an Best Practices & Funktionsumfang der MapComponents-Referenz bringen. Jede Aufgabe mit Priorität (P1–P3), Kategorie und grobem Aufwand (S=klein <1h, M=1–3h, L= >3h). 

Legende Kategorien: 
- ARCH (Architektur)  
- PERF (Performance)  
- DX (Developer Experience)  
- SEC (Security/Privacy)  
- A11Y (Accessibility)  
- FEAT (Neue Funktion)  
- TEST (Tests / Qualität)  
- DOC (Dokumentation)  
- UP (Upstream Contribution Kandidat)

---
## 1. Quick Wins (P1, sofort umsetzbar)
| ID | Aufgabe | Kategorie | Aufwand | Begründung (Capability Verweis) | Notizen |
|----|---------|-----------|---------|---------------------------------|---------|
| QW-01 | `useChapters()` mehrfach in `MapTellingApp.tsx` zwischenspeichern (einmal auslesen) | PERF | S | Reduziert Hook-Aufrufe & Re-Renders (Sec 20 Re-Renders) | Lokale Konstante `const chaptersCtx = useChapters();` |
| QW-02 | `trackData` Fetch mit `AbortController` & Fehlerzustand erweitern | PERF/SEC | S | Daten-Laden & Abort (Sec 67) | Status Anzeige bei Fehler |
| QW-03 | Marker/Route Layer mit stabilen IDs (`route-line`, `route-glow`) dokumentieren | PERF | S | Layer ID Stabilität (Sec 48 Duplicate layers) | Composite Komponente konfigurieren |
| QW-04 | Entfernen doppelter `useChapters().chapters[0]` Zugriffe -> Memo startView | PERF | S | Minimiert Objektzugriffe | `useMemo` auf startChapter |
| QW-05 | Konsolidierte Props für `MapLibreMap` (Style Objekt prefetch statt URL) | PERF | S | Style Flash vermeiden (Sec 48 Style flash) | Preload fetch + Objekt übergeben |
| QW-06 | Einbau Error Boundary um `InnerApp` | ARCH | S | Fehlerbehandlung (Sec 66) | Implementiert (`MapErrorBoundary`) |
| QW-07 | Progress Bar `animate` Anteil mit vorberechneter total Variable | PERF | S | Mikro-Optimierung Re-Renders | `const total = chaptersCtx.total;` |
| QW-08 | Terrain Umschaltbar machen (Toggle) | FEAT/PERF | S | Terrain Performance Guard (Sec 69) | Button oder Config Flag |
| QW-09 | Deprecation Audit: Sicherstellen keinerlei `paint`/`layout` direkt genutzt | DX | S | Deprecation Policy (Sec 57/74) | Script/grep |
| QW-10 | README Kurzabschnitt "Architektur & Komponenten" ableiten | DOC | S | Onboarding (Sec 44 Contribution Workflow) | Verweis auf Capabilities |

## 2. Kurzfrist (P1–P2, <1 Sprint)
| ID | Aufgabe | Kat | Aufwand | Verweis | Notizen |
|----|---------|-----|---------|---------|---------|
| ST-01 | Einführung `MlTerrain` (eigene deklarative Komponente) statt `TerrainManager` | ARCH/UP | M | Terrain Status (Sec 83) | Lokal abstrahieren + möglicher Upstream PR |
| ST-02 | Kamera/Narrative Animations FPS Mess Hook light einbauen (optional toggelbar) | PERF | M | Performance Messpunkte (Sec 56/68) | Kleiner Hook `useFpsSample` |
| ST-03 | Scroll Story Kapitel -> unify Chapter Navigation & Scroll Events (reduce duplication) | ARCH | M | Workflow Patterns (Sec 7) | Single Controller Komponente |
| ST-04 | Implement Logging Wrapper (debug/info/warn/error) | DX | S | Logging (Sec 73) | Fertig (`utils/logger.ts`) |
| ST-05 | Security: Popup / Overlay Text Sanitizer Utility vorbereiten | SEC | S | Sanitization (Sec 78) | `safeText()` Integration |
| ST-06 | Add Abort + Timeout (Promise.race) bei Track Fetch | SEC | S | Resilienz (Sec 66) | Timeout 8s default |
| ST-07 | Layer Diff Hash für Track (bereits Composite?) validieren & isolieren | PERF | S | Structural Hash (Sec 67) | Reuse vorhandene Utility falls existiert |
| ST-08 | Introduce `useMapReady` convenience hook (wrap `useMap`) | DX/UP | M | Hook Guidelines (Sec 47) | Upstream Kandidat |
| ST-09 | Split UI vs Core Lazy Imports (StoryScroller, Overlay lazy) | PERF | M | Bundle Size (Sec 65) | React.lazy + Suspense |
| ST-10 | Basic Error Toast / Status Banner (style failure, data failure) | UX/ARCH | S | Fehlerbehandlung (Sec 66) | Minimal Komponente |

## 3. Mittelfrist (P2)
| ID | Aufgabe | Kat | Aufwand | Verweis | Notizen |
|----|---------|-----|---------|---------|---------|
| MT-01 | API Extraktions-Skript (kleiner Umfang nur für verwendete Imports) | DX | M | API Drift Monitor (Sec 28) | Lokale JSON Cache |
| MT-02 | Strukturierte Kapitel-Konfiguration Types definieren (z.B. `ChapterConfig` Interface) | DX | S | Typisierung & Conventions (Sec 11) | `types/story.ts` |
| MT-03 | SSR-Vorbereitung: dyn Import der Map (Framework Agnostik) | ARCH | M | SSR Patterns (Sec 64) | Optionale Next.js Adaption |
| MT-04 | Offline Cache (Service Worker precache track + style) | FEAT/SEC | M | Offline Strategie (Sec 77) | Minimal SW Precache (Track) |
| MT-05 | Performance Benchmark Script (Add/Remove synthetic layers) | PERF | M | Bench Ziele (Sec 68) | Node + Puppeteer / Playwright optional |
| MT-06 | Introduce A11y Skip Link & aria-labels for navigation controls | A11Y | S | A11y Deep Dive (Sec 71) | Implementiert (Skip-Link + Rollen + i18n Scaffold) |
| MT-07 | Logging Level Toggle über URL Param ?debug=1 | DX | S | Logging (Sec 73) | Parse on load |
| MT-08 | Refactor Track Loading -> support alt protocols (csv://, gpx://) | FEAT | M | Protocol Handlers (Sec 42/52) | Normalisierung in Loader Funktion |
| MT-09 | Hash-based memoization für Kapitel Marker FeatureCollection | PERF | M | Perf Hash (Sec 20 / 67) | Avoid rebuilds |
| MT-10 | Theming Hook für UI (hell/dunkel) statt ModeToggle nur Interaktivität | UX | M | Theme & Style (Sec 55) | Provide theme context |

## 4. Längerfristig (P3)
| ID | Aufgabe | Kat | Aufwand | Verweis | Notizen |
|----|---------|-----|---------|---------|---------|
| LT-01 | Umstellung auf modulare Entry Points (core vs narrative vs experimental) | ARCH | L | Exportoberfläche Struktur (Sec 36/65) | Multi-Bundle in Build |
| LT-02 | Worker-basierte CSV/GPX Konvertierung (Streaming) | PERF/SEC | L | Progressive Parsing (Sec 67) | Prototyp implementiert (Basis Parser + Worker, noch kein Streaming) |
| LT-03 | Vector Tile DSL Proof-of-Concept für zukünftige Routen/Layers | FEAT/UP | L | Vector Tile Best Practices (Sec 76) | Prototyp DSL Schema + Validator + Conversion |
| LT-04 | Advanced Camera Path Editor (UI) | FEAT | L | Hooks (useCameraFollowPath) (Sec 51) | Timeline UI |
| LT-05 | API Drift CI Action (Vergleich vorher/nachher hashFeatureCollection) | DX | M | API Drift (Sec 28) | Github Action YAML |
| LT-06 | Security Hardening: CSP Header Doku & Integration Beispiel | SEC | M | CSP (Sec 78) | README Abschnitt |
| LT-07 | Full A11y Audit (axe + Lighthouse scripted) | A11Y | M | A11y Checklist (Sec 33/71) | CI Step |
| LT-08 | Terrain Performance Profiling + adaptive quality | PERF | L | Terrain Status (Sec 83) | pitch/zoom heuristics |
| LT-09 | Multi-Map Sync Abstraktion als Upstream Hook | UP | M | Wrapper Events (Sec 53) | `useMapSync(sourceId,targetId,opts)` |
| LT-10 | Plugin System Exploration (Register narrative modules) | ARCH/UP | L | Extension Guidelines (Sec 47) | Evaluate feasibility |

## 5. Testing & Qualität (ergänzende Tasks)
| ID | Aufgabe | Priorität | Verweis | Notizen |
|----|---------|-----------|---------|---------|
| TQ-01 | Unit Test: Chapter Navigation Edge Cases (first/last rapid calls) | P1 | Hooks (Sec 51) | Race & bounds |
| TQ-02 | Unit Test: CompositeGeoJsonLine diff skip on unchanged hash | P1 | Perf Hash (Sec 67) | Mock unchanged data |
| TQ-03 | Integration Test: Mode Toggle -> disables viewport sync | P2 | Workflow (Sec 7) | Expect no sync events |
| TQ-04 | Accessibility Test: aria-labels present for Nav Controls | P2 | A11y (Sec 71) | Implementiert (`a11yNavigation.test.tsx`) |
| TQ-05 | Performance Smoke: Add 50 markers -> <X ms | P3 | Bench Ziele (Sec 68) | Baseline threshold |

## 6. Security & Privacy Detail
| ID | Aufgabe | Verweis | Beschreibung |
|----|---------|---------|--------------|
| SEC-01 | Input Sanitizer util implementieren & in StoryOverlay nutzen | Sec 78 | Schutz gegen XSS in Kapiteltext |
| SEC-02 | Größengrenze Track GeoJSON (< 2MB) validieren | Sec 23/59 | Implementiert (2MB Limit + Fehleranzeige) |
| SEC-03 | CSP Empfehlung dokumentieren | Sec 78 | README Abschnitt "Security" |
| SEC-04 | Protokoll Allowlist vorbereiten (future) | Sec 78 | Scaffold (`utils/protocols.ts`) + Default Protokolle |

## 7. Architektur / Code Struktur
| ID | Aufgabe | Verweis | Ziel |
|----|---------|---------|-----|
| ARCH-01 | `components/` Unterordner logisch gruppieren (core/ui/story/map) | Sec 47/75 | Klarheit & Tree-Shaking |
| ARCH-02 | `hooks/` Präfix `use` Konsistenzreview | Sec 75 | Einheitliche Namensgebung |
| ARCH-03 | Einführung `types/` Ordner für zentrale Interfaces | Sec 11 | Typkonsistenz |
| ARCH-04 | `utils/` Ordner für logger, hashing, sanitization | Sec 78 | Wiederverwendung |

## 8. Developer Experience
| ID | Aufgabe | Verweis | Ziel |
|----|---------|---------|-----|
| DX-01 | Prettier & ESLint Config hinzufügen (falls fehlt) | Sec 21 | Konsistenter Stil |
| DX-02 | Husky Pre-Commit (lint + typecheck) | Sec 21 | Fehler früher erkennen |
| DX-03 | VSCode Settings Empfehlungen (extensions.json) | Sec 44 | Schneller Einstieg |
| DX-04 | Backlog Automations: Task Labels in Issues | Sec 85 | Sichtbarkeit |

## 9. Dokumentation
| ID | Aufgabe | Verweis | Ziel |
|----|---------|---------|-----|
| DOC-01 | README: Architekturdiagramm (Provider -> Map -> Layers -> Story) | Sec 37/38 | Verständnis |
| DOC-02 | README: Performance Empfehlungen Kurzliste | Sec 20 | Nutzerführung |
| DOC-03 | README: Security Hinweise (CSP, Sanitizer) | Sec 78 | Hardening |
| DOC-04 | CHANGELOG einführen (Conventional Commits) | Sec 74/81 | Historie |
| DOC-05 | CONTRIBUTING.md minimal | Sec 44/85 | Onboarding |

## 10. Upstream Contribution Kandidaten
| Kandidat | Beschreibung | Capability Bezug | Erste Schritte |
|----------|--------------|------------------|---------------|
| MlTerrain (stabil) | Deklarative Terrain Einbindung | Sec 83 | API definieren, Test, PR |
| useMapSync Hook | Sync mehrere Maps deklarativ | Sec 53 | Prototyp lokal, Issue eröffnen |
| useMapReady Hook | Einfacher Ready-Zugriff | Sec 51 | Implementiert (`useMapReady` + Test) |
| Perf Hash Utility (generisch) | Wiederverwendbare FeatureCollection Hash Function | Sec 67 | Utility isolieren & dokumentieren |
| Narrative Chapter Components | Kapitel Scroller generisch | Sec 7/26 | Abstraktion entkoppeln |

## 11. Priorisierte Roadmap (Sequenz Vorschlag)
1. Quick Wins (QW-01 – QW-10) + Baseline Security (SEC-01)  
2. Tests (TQ-01, TQ-02) zur Absicherung von Composite & Navigation  
3. Architektur Cleanup (ARCH-01 bis ARCH-04)  
4. Performance & Bundle (ST-09, QW-05, ST-02)  ✅ (ST-09, ST-02 erledigt; QW-05 bereits integriert) 
5. Terrain & Sync Hooks (ST-01, LT-09)  (ST-01 umgesetzt: MlTerrain ersetzt TerrainManager; LT-09 Prototyp useMapSync angelegt) 
6. Offline / Protocol Erweiterungen (MT-08, MT-04)  
7. A11y & Internationalisierung Feinschliff (MT-06, A11y Skip Link)  
8. Langfristige Worker & DSL Initiativen (LT-02, LT-03)  

## 12. Metriken zur Erfolgsmessung
| Kennzahl | Ziel | Messung |
|----------|-----|--------|
| Cold Start (Map sichtbar) | <1.5s lokal / <2.5s prod | Performance.now() Logs |
| Route Layer Repaint nach Kapitelwechsel | <100ms | Custom mark/measure |
| Bundle Initial JS | <250KB gzip | Build Report |
| Core Lighthouse Performance | >85 | Lighthouse CI |
| A11y Score | >90 | Lighthouse/axe |
| Fehlerquote (Sentry o.ä.) | <1% Sessions | Fehler Tracking |

## 13. Risiken & Gegenmaßnahmen
| Risiko | Auswirkung | Mitigation |
|-------|-----------|-----------|
| Over-Engineering frühe Phase | Verzögerter Mehrwert | Strikte Priorisierung Quick Wins zuerst |
| Terrain Performance Regression | Schlechte UX | Toggle + Mess Hook + Feature Flag |
| Fehlende Tests bei Refactor | Regressions | Tests (TQ-01/02) früh implementieren |
| Security Lücken (Popup XSS) | Nutzer Risiko | Sanitizer früh integrieren |
| Bundle Wachstum durch Lazy Fehler | Verzögerte Interaktivität | Build Report Monitoring |

## 14. Offene Fragen
| Thema | Frage | Geplanter Klärungsweg |
|-------|-------|----------------------|
| Chapter Data Herkunft | Statisch vs Remote Laden? | Entscheidung vor Offline Support |
| Multi-Language Bedarf | Ist i18n notwendig? | Stakeholder Feedback |
| Protocol Handler Umfang | csv/gpx ausreichend? | Use-Cases sammeln |
| Worker Invest | Rechfertigt Datenvolumen Worker? | Benchmark (MT-05) |

---
Stand: 2025-09-04  
Nächste Aktualisierung nach Abschluss Quick Wins oder API Erweiterungen.
