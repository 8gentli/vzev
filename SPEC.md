# Architecture & Specification (SPEC.md)

## 1. UI & User Experience (UX)
*   **Design Language:** Minimalistic Material Design.
*   **Localization:** German. All UI text, charts, and legends must be displayed in German.
*   **Themes:** User-selectable Light and Dark mode.
*   **Color Palette:**
    *   *Negative/Consumption:* `IndianRed`
    *   *Neutral/Standard:* `SteelBlue`
    *   *Positive/PV Surplus:* `SeaGreen`
*   **Chart Implementation:** Apache ECharts. 
    *   *Visuals:* A central Tachometer Gauge (0 to 10 kW) displaying current PV Surplus and load recommendations. Icons (Saugen, Waschen, Kochen, Heizen) are natively embedded into the ECharts canvas via SVG vectors using a Dual-Series config for rock-solid responsive scaling. Below it, a clean line chart showing PV Generation and Consumption with delta shading.
*   **Chart Constraints:** Y-Axis must be strictly fixed from `0` to `15` kW. X-Axis must dynamically span from Sunrise to Sunset (Home Assistant `sun.sun` entity can be used for logic), with a fallback of `05:00` to `22:00`.
    *   **Features:** Dynamic resizing, multi-line overlays, native SVG integration, interactive tooltips. The history chart runs on a continuous `time` axis, natively scaling time labels (hours, mins) during pan and zoom actions. It stacks Consumption and PV Surplus geometrically to synthesize an accurate bounding curve against the raw PV generation line. It maintains full 1-minute data resolution on the daily view, discarding all negative surplus inputs at the database level.

## 2. Data Model & Integration
*   **Live Metrics Source:** Direct POST requests to the local Solar-Log JSON API (`/getjp`) yielding data every minute.
*   **Sun Source:** Home Assistant REST API for `sun.sun` (next_rising/setting).
*   **Database:** A local SQLite cache (`vzev.db`) storing minute-by-minute Solar-Log extractions, strictly governed by hardcoded `tzdata` (`Europe/Zurich`) to completely detach from Docker OS time constraints.
*   **Billing/Monthly Data (Future):** Imported exclusively via `.ebix` XML files containing 15-minute intervals for all vZEV participants and feed-ins. These are disjoint from the daily live data but may share the same database core.
*   **Surplus Logic:** `PV yield - Consumption` (clipped to 0.0 directly during ingestion logic). Evaluated and fed natively via API.

## 3. Monorepo Repository Structure
To keep the different application domains isolated, we will use a Microservice directory pattern orchestrated by Docker.

```text
/vzev
├── frontend/               # The Vite PWA (Dashboard UI)
│   ├── src/components/     # ECharts, Material CSS, Auth views
│   └── package.json        
│
├── backend-api/            # Python FastAPI (Auth, HA Proxy, Core API)
│   ├── routers/            # /api/v1/surplus, /api/auth
│   └── requirements.txt    # Standard, lightweight API deps
│
├── ml-engine/              # [FUTURE] Independent ML inference worker
│   ├── models/             # CPU-based statistical models
│   └── requirements.txt    # Heavy ML deps (isolated away from backend-api)
│
├── billing/                # [FUTURE] Invoicing generator script
│   ├── export/             # PDF generation logic
│   └── requirements.txt          
│
└── docker-compose.yml      # Orchestrates all distinct containers and connects them
```

## 4. API Contracts (MVP)
*   **`GET /api/v1/surplus/daily`** 
    *   *Description:* Retrieves the 24-hour history of PV power, Consumption, and native Surplus mapped strictly via ISO timestamps for ECharts array mapping, dynamically padded with `nulls` beyond the current minute to ensure empty chart projection up to 22:00.
*   **Live Data Syncing:**
    *   *Description:* Replaces the legacy WS model. The Vite frontend runs an invisible `60-second` interval block that continuously fetches the `daily` JSON endpoint silently, providing a flawlessly robust live data flow synced exactly to the SQLite polling frequency.
*   **`POST /api/v1/auth/login`**
    *   *Description:* Validates user credentials against SQLite and returns a secure, persistent JWT cookie for the PWA.
