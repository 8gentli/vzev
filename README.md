# vZEV - PV Surplus Dashboard

A purely local, Docker orchestrator-based Progressive Web App (PWA) displaying current and historic photovoltaic (PV) surplus powered by real-time Solar-Log data.

*Designed around a microservice monorepo for future ML forecasting and automated billing extensions.*

## 🏗️ Technical Overview

- **Frontend**: Vite + React + Apache ECharts. In **`frontend/vite.config.js`** the dev server listens on **port 80** (for Docker: host **8080** → container **80**). The proxy forwards **`/api`** to **`http://backend:8000`** (resolvable only on the Docker network).
- **Docker**: `docker compose` maps **`8080:80`**. The backend is also published on host **8000**. The frontend image build uses **`frontend/.dockerignore`** (host **`node_modules`** must not be copied into the image — avoids **`vite: Permission denied`** on Linux).
- **Backend**: Python FastAPI with a local SQLite store and a REST API; the scheduler polls the Solar-Log JSON interface on your LAN.
- **Data source**: High-frequency local network access to the Solar-Log device (e.g. `POST` to `/getjp`).

*See `REQ.md`, `SPEC.md`, and `DECISIONS.md` in this repository for architecture and data models.*

## 🚀 Setup & Installation

**Prerequisites:** Docker and Docker Compose on a host in the same network as the Solar-Log (for containerized use). For local development, Node.js and Python 3 are required.

1. **Clone the repository locally.**
   - Optional deploy sync (example): unidirectional copy from a dev machine to a server (excludes secrets and build artifacts as needed):

   ```bash
   rsync -avz --delete --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='.env' \
     ~/antigravity/projects/vzev/ simon@server-elitebook:/home/simon/docker/vzev/
   ```

2. **Configure environment (backend).**
   - Create a **`.env`** file in **`backend-api/`** (this file is gitignored and is not on GitHub).
   - At minimum, set your Solar-Log URL, for example:

   ```env
   SOLARLOG_URL="http://solar-log/getjp"
   ```

   Optional (for future Home Assistant integration in code): `HA_URL`, `HA_TOKEN`.

3. **Boot the stack (Docker).**

   ```bash
   docker compose up -d --build
   ```

   Use **`--build`** after **code or Dockerfile changes** so images include the new files; for a simple restart with unchanged images, `docker compose up -d` is enough.

   (or `docker-compose up -d --build` if your installation still uses the hyphenated command.)

4. **Reverse proxy (e.g. Nginx / OpenResty).**  
   Point your hostname to **host port 8080** (Vite inside the frontend container). The FastAPI backend reaches Solar-Log on the LAN; keep it behind your firewall. Enable WebSocket support on the proxy if you rely on Vite live reload through that route.

## 💻 Development Workflow

Run services on the host **without** Docker (optional):

**Frontend (terminal 1)**

```bash
cd frontend
npm install
npm run dev
```

By default **`vite.config.js`** uses **port 80** → open **http://localhost/** (on Windows you may need elevated rights for port 80). For a normal dev port use e.g. **`npm run dev -- --port 5173`** → **http://localhost:5173**.

The **`/api`** proxy targets **`http://backend:8000`**, which only resolves **inside Docker**. If both backend and frontend run on the host, set the proxy in **`vite.config.js`** to **`http://127.0.0.1:8000`**, or prefer **`docker compose up`** so hostnames match.

**Backend (terminal 2)**

```bash
cd backend-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Run **`uvicorn`** from **`backend-api`** so **`load_dotenv()`** picks up **`backend-api/.env`**.

Until Solar-Log delivers rows into SQLite, the UI may show **0 kW** or **empty series** while the daily timeline still loads.

## 🐙 Git & GitHub Cheat Sheet

If you are new to Git, follow this step-by-step workflow every time you work on the project to keep everything safe and synced.

### Everyday Workflow

**1. Update your local project**  
Before you start working, always make sure you have the newest version from GitHub:

```bash
git pull
```

**2. Make your coding changes as usual...**  
(Edit files, test everything, etc.)

**3. Stage your changes**  
When you are happy with your changes, tell Git to pack all updated files:

```bash
git add .
```

*(Optional: Use `git status` before and after to see which files were changed).*

**4. Commit your changes**  
Wrap the packed files into a commit with a little note about what you did:

```bash
git commit -m "Ein kurzer Text darüber, was du geändert hast"
```

**5. Push to GitHub**  
Finally, send your stored commit safely to your GitHub repository:

```bash
git push
```

---

### Initial Repository Creation

If you ever need to recreate the remote repository from scratch or on a new machine, you can do it easily using the GitHub CLI:

```bash
gh repo create vzev --public --source=. --remote=origin --push
```
