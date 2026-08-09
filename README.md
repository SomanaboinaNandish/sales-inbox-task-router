# Sales Inbox Task Router

### Candidate ID: `priya.sharma@gmail.com`
### Deployed Backend URL: `https://sales-inbox-task-router-backend.onrender.com`
### Deployed Frontend URL: `https://sales-inbox-task-router-frontend.vercel.app`
### GitHub Repository: `https://github.com/priyasharma/sales-inbox-task-router`

---

## 1. Overview
The **Sales Inbox Task Router** is an automated inbox router built to solve enterprise inbound sales and operations routing friction. It intercepts incoming emails, classifies them using the Gemini API based on a customized company roster and business rules, reconciles ongoing threads to prevent duplication, and logs skipped emails (such as Out-of-Office autoreplies, newsletters, and vendor spam) for transparency.

It also provides the operations team with a **conversational grounding engine** utilizing a secure Text-to-SQL architecture that translates natural language queries into read-only SQL queries on the local SQLite store, eliminating hallucinations.

---

## 2. Quick Setup

Set up and run the project locally in **three commands or fewer**:

### Step 1: Install All Dependencies
```bash
npm run install:all
```

### Step 2: Configure Environment
Copy `.env.example` in the `backend` directory to `.env` and fill in your Gemini API key:
```bash
cp backend/.env.example backend/.env
```
*(On Windows PowerShell, use: `cp backend/.env.example backend/.env`)*

### Step 3: Run Servers
Start the backend and frontend development servers:
* In terminal 1 (start backend):
  ```bash
  npm run dev:backend
  ```
* In terminal 2 (start frontend):
  ```bash
  npm run dev:frontend
  ```

---

## 3. Technology Stack
- **Backend**: Node.js (ES Modules), Express, SQLite3 (via `sqlite` and `sqlite3`), dotenv, and the `@google/genai` SDK.
- **Frontend**: Vite, React, TypeScript, Lucide Icons, and Vanilla CSS (premium dark theme featuring glassmorphic panels and glowing status cards).

---

## 4. Key Endpoints

- `GET /users` — Returns the company team roster.
- `POST /tasks` — Raw Task API creator (validates enums, returns exact 400 error shapes for invalid fields).
- `PATCH /tasks/{task_id}` — Updates a task.
- `GET /tasks?candidate_id={email}` — Fetches list of tasks.
- `POST /ingest` — Ingests a batch of emails, processes and routes them.
- `GET /api/stats` — Fetches aggregate metrics and run summaries.
- `POST /api/chat` — Conversational grounded chatbot query engine.
