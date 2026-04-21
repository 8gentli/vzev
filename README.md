# vZEV - PV Surplus Dashboard

A purely local, Docker orchestrator-based Progressive Web App (PWA) displaying current and historic photovoltaic (PV) surplus powered by real-time Solar-Log data. 

*Designed around a microservice monorepo for future ML forecasting and automated billing extensions.*

## 🏗️ Technical Overview

*   **Frontend**: Vite PWA generating interactive, real-time charts via Apache ECharts (served reliably via Nginx on port 8080).
*   **Backend**: Python FastAPI functioning as a secure SQLite aggregation layer and REST API.
*   **Data Source**: Direct high-frequency local network polling of the Solar-Log JSON interface.

*See `REQ.md`, `SPEC.md`, and `DECISIONS.md` inside this repository for architectural constraints and exact data models.*

## 🚀 Setup & Installation

**Prerequisites:** A host machine running Docker and Docker Compose (in the same local network as the Solar-Log).

1.  **Clone the repository locally.**
    *   Easiest way: Sync files unidirectionally from development host to deployment server with rsync via ssh:
        ```bash
        rsync -avz --delete --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='.env'  ~/antigravity/projects/vzev/ simon@server-elitebook:/home/simon/docker/vzev/
        ```
2.  **Configure Environment:**
    *   Create a `.env` file in the `/backend-api` folder.
    *   Provide your Solar-Log URL:
        ```env
        SOLARLOG_URL="http://solar-log/getjp"
        ```
3.  **Boot the Environment:**
    ```bash
    docker compose up -d --build
    ```
    (or `docker-compose up -d --build` (with hyphen) depending on your Docker installation)
4.  **Expose via Nginx Proxy Manager:** 
    Route your DuckDNS incoming traffic exclusively to the Vite Frontend container port (`8080`). The FastAPI backend handles all local Solar-Log polling securely behind the firewall. Ensure `Websockets Support` is activated in your proxy if you rely on live dev-reloading.

## 💻 Development Workflow

If developing without Docker, you can run the services independently:

**Frontend (Terminal 1):**
```bash
cd frontend
npm install
npm run dev
```

**Backend (Terminal 2):**
```bash
cd backend-api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
*(Development Note: A Mock Data toggle is available in the backend to locally synthesize sine-wave PV data, allowing UI testing without requiring an active data source connection).*

## 🐙 Git & GitHub Cheat Sheet

If you are new to Git, follow this step-by-step workflow every time you work on the project to keep everything safe and synced.

### Der alltägliche Workflow (Everyday Workflow)

**1. Update your local project (Hol dir die neuesten Änderungen)**
Before you start working, always make sure you have the newest version from GitHub:
```bash
git pull
```

**2. Make your coding changes as usual...**
(Edit files, test everything, etc.)

**3. Stage your changes (Bereite Dateien zum Speichern vor)**
When you are happy with your changes, tell Git to pack all updated files:
```bash
git add .
```
*(Optional: Use `git status` before and after to see which files were changed).*

**4. Commit your changes (Speichere den aktuellen Stand ab)**
Wrap the packed files into a commit with a little note about what you did:
```bash
git commit -m "Ein kurzer Text darüber, was du geändert hast"
```

**5. Push to GitHub (Lade deine Arbeit ins Internet hoch)**
Finally, send your stored commit safely to your GitHub repository:
```bash
git push
```

---

### Initial Repository Creation (Nur nötig bei einem neuen Setup)
If you ever need to recreate the remote repository from scratch or on a new machine, you can do it easily using the GitHub CLI:
```bash
gh repo create vzev --public --source=. --remote=origin --push
```
