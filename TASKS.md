# Project Tasks (TASKS.md)

## Planning & Documentation
- [x] **DONE**: Define Architecture (Data, Hosting, Repo)
- [x] **DONE**: Create project documents (INSTRUCTIONS, REQ, SPEC, DECISIONS)
- [ ] **IN-PROGRESS**: Finish documentation phase (TASKS, STATE, README)

## Infrastructure Setup
- [x] **DONE**: Initialize Vite frontend project setup.
- [x] **DONE**: Initialize Python FastAPI backend environment.
- [x] **DONE**: Create Dockerfiles for front/backend and root `docker-compose.yml`.
- [ ] **TODO**: Clean up redundant constraints section in `INSTRUCTIONS.md`.

## Backend MVP (Data & API)
- [x] **DONE**: Build Mock Data Generator in FastAPI.
- [x] **DONE**: Develop `GET /api/v1/surplus/daily` route serving historical data from SQLite.
- [x] **DONE**: Integrate direct Solar-Log JSON polling (`getjp`) inside an autonomous background task.
- [x] **DONE**: Lock TZData explicitly to Europe/Zurich for bulletproof timestamps.

## Frontend MVP (UI & Chart)
- [x] **DONE**: Build base Dashboard layout and Material Theme Toggle (Light/Dark Mode).
- [x] **DONE**: Integrate Apache ECharts component.
- [x] **DONE**: Connect frontend Axios/Fetch logic to backend API with silent 60-second auto-reloads.
- [x] **DONE**: Execute perfect UI data matching. Implement Echarts `time` stacked Areas to trace realistic surplus envelopes.
- [ ] **TODO**: Add PWA `manifest.json`, ICO and basic service worker for mobile installation.

## QA & Handoff
- [x] **DONE**: Perform full visual UI checking.
- [x] **DONE**: Verify `docker-compose up` builds and external exposition via NPM port 8080 work cleanly.
- [x] **DONE**: Write complete README constraints.

## Future Backlog (Post-MVP)
- [ ] **TODO**: Implement SQLite multi-tenant user table and schema.
- [ ] **TODO**: Build Email/Password login UI and JWT backend authentication.
- [ ] **TODO**: Restrict API endpoints so each of the 6 parties sees only scoped data.
- [ ] **TODO**: Implement push notification system (e.g., "PV surplus > 2kW") via PWA Service Worker.
- [ ] **TODO**: Develop Python ML inference script for power forecasting and map it to ECharts overlay.
- [ ] **TODO**: Build automated PDF invoice generation script (billing module).
- [ ] **TODO**: Production frontend — run **`vite build`** and deploy **`dist/`** as static assets instead of the Vite dev server in Docker.
