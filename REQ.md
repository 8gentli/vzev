# Requirements (REQ.md)

## 1. Functional Requirements (MVP)
*   **PV Surplus Dashboard:** Interactive daily chart displaying the current PV surplus power.
*   **Global MVP Data:** The chart displays a global view of the surplus that is identical for all users. User-specific filtering is excluded from the MVP.

## 2. Non-Functional Requirements
*   **Infrastructure Constraint:** No mandatory paid cloud subscriptions. Must be fully hostable on a home server (Docker) without a static IP.
*   **Accessibility:** Must be securely exposed to the outside world via the existing DuckDNS and Nginx Proxy Manager setup.
*   **Code Transparency (Knowledge Transfer):** 
    *   *Frontend:* Code must be simple and easily understandable without deep modern-JS framework knowledge. One component per file, explicit prop documentation, no "magic" abstractions.
    *   *Backend:* Python functions must have explicit one-line docstrings and must avoid hidden/implicit side effects.
*   **Localization:** All visible texts in the frontend must be in German exclusively.
*   **Mobile-Ready Basis:** Frontend configured as a Progressive Web App (PWA) from day one to allow users to "install" it on their home screens.

## 3. Backlog (Future Extensibility)
*   [ ] **Push Notifications:** Alert users automatically (e.g., "PV surplus > 2 kW available").
*   [ ] **ML Power Forecast:** Overlay machine learning-based predictions on the chart. Must be capable of running locally on CPU.
*   [ ] **Monthly Views:** Aggregate charts showing total community consumption alongside individual per-user breakdown history.
*   [ ] **Multi-Tenancy & Auth:** Secure login for all 6 parties where each sees solely their scoped data, utilizing persistent sessions (so installed PWAs do not require constant re-login).
*   [ ] **Automated Billing:** Invoice generation via a separate future module within the monorepo architecture.
