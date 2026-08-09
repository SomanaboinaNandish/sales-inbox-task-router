# DECISIONS.md — Sales Inbox Task Router Tradeoffs & Decisions

This document details the architectural decisions, design tradeoffs, and technical implementations chosen for the Sales Inbox Task Router.

Candidate ID: **priya.sharma@gmail.com**

---

## 1. Tradeoffs & Decisions

### Decision 1: Handling Gemini Rate Limits and Retries
- **Implementation**: The LLM classification and query-generation functions are wrapped in a robust, exponential backoff-retry loop with jitter (`classifier.js`). When a `429` (Rate Limit Exceeded) or `5xx` (Server Error) is returned by the Gemini API, the system waits for an increasing amount of time (`delay * 2^attempt + random_jitter`) before retrying, up to 5 times.
- **Tradeoff**: Running calls synchronously within `/ingest` ensures that the API returns only after all work has been committed to the database. However, this means that a large batch of emails under rate-limiting can block the HTTP connection. If we had more time, we would implement an asynchronous queue (e.g. BullMQ with Redis) and update the UI via WebSockets or polling, returning a `202 Accepted` immediately.

### Decision 2: Enforcing Idempotency and Thread Reconciliation
- **Implementation**:
  - **Idempotency**: During `/ingest`, we first perform a database check: `SELECT * FROM processed_emails WHERE email_id = ?`. If the email has already been processed, we skip LLM classification entirely and avoid modifying the task store.
  - **Thread Reconciliation**: For new emails, we check if the thread already has a corresponding task: `SELECT * FROM tasks WHERE thread_id = ?`. If a task is found, we run a specialized prompt containing the existing task parameters. Gemini determines if budget/deadlines are updated and returns the update values, which we write to the task using a SQL `UPDATE` (simulating a `PATCH /tasks/{id}` request).
- **Tradeoff**: We chose database checks over in-memory caching to guarantee persistence. This introduces minor database read overhead per email, which is negligible for SQLite WAL mode but ensures that restarts on free-tier hosting platforms do not wipe our idempotency and thread mappings.

### Decision 3: Backend Data Model Design for Instant Stats and Auditing
- **Implementation**: We separated the tables into:
  1. `tasks`: Conforming strictly to the grading API spec.
  2. `processed_emails`: Auditing table storing email records, category predictions, priorities, confidence, and reasoning, regardless of whether they were ignored (spam/OOO) or created as tasks.
  3. `runs`: Recording statistics for each batch ingestion.
- **Tradeoff**: Rather than keeping only the `tasks` table, creating the separate `processed_emails` table allows the operations team to see exactly *why* a particular newsletter or spam email was skipped. The dashboard and stats endpoint (`/api/stats`) can instantly read counts, category splits, and spurious rates using fast SQL queries without contacting Gemini.

### Decision 4: Safe Text-to-SQL Conversational Grounding
- **Implementation**: The chat panel does not rely on Gemini "vibes" or summarization of raw text. Instead, we use a two-phase grounding query path:
  1. **Phase 1 (NL to SQL)**: Gemini receives the system schema, candidate ID, and the most recent `run_id`. It translates the user's natural language question into a read-only SQLite `SELECT` query.
  2. **Phase 2 (Execution & Summary)**: The backend runs this query against the SQLite database, receiving raw JSON rows. It feeds this raw data back to Gemini to draft the final response, returning BOTH the answer and the raw JSON `supporting_data` to the client.
- **Tradeoff**: If the query is out of scope (e.g., trying to write or delete tasks, or asking general knowledge), the backend intercepts this and returns a polite rejection. While this restricts the bot to database-related queries, it completely prevents hallucinated numbers.

### Decision 5: The "TBD Budget" Fallback Misrouting
- **Implementation**: If an email contains no stated budget (e.g., *"budget is TBD"*), the classifier sets `deal_value_inr` to `null`. In the absence of a value, the router maps it to Rohit Sharma (`u_rohit`, Sales - SMB) under the assumption that it's a standard SMB demo request.
- **Tradeoff**: In reality, a large company requesting a demo with "budget TBD" should go to Aarti (Enterprise). Because we do not check domain extensions or company size metadata during routing, this email is misrouted to SMB. We shipped this because resolving company size dynamically requires external APIs or complex lookup databases, which was out of scope for the core routing rules.

---

## 2. What I'd Do With Two More Weeks
1. **Background Job Queue**: Transition `/ingest` to an asynchronous worker queue (like BullMQ + Redis) with a SSE/WebSocket connection to push live status updates to the dashboard.
2. **Domain/Company Sizing Lookup**: Integrate a clearbit or similar enrichment API to automatically fetch company size, funding, and industry from email domains to route "budget TBD" emails correctly.
3. **Draft Reply Generation**: Have Gemini draft a context-aware response based on the category (e.g., auto-generating a demo calendar link for SMB enquiries, or requesting standard details for triages) and show it on the task details panel.
4. **Vector Search (RAG) Integration**: Include semantic embedding search alongside structured SQL queries, allowing the chat bot to search specific email bodies (e.g. *"Show me the email where they complained about a Pune vendor"*).
