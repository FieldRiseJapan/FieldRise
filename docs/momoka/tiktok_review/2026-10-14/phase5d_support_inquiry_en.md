# OpenAI Support inquiry — English
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


Only the text below is a proposed outgoing message. Do not send before the president approves.

---
Subject: ChatGPT Sites — supported cross-version maintenance boundary, drain and safe database migration

Hello OpenAI Support,

We operate a public web app on ChatGPT Sites and are planning a data-preserving database migration. Please route this request to the Sites technical team. We need Sites-specific guarantees and supported procedures. Changes and outbound application operations are currently paused; this is an information request, not authorization to change our Site.

Our priority is a host-enforced boundary that also covers older code which does not understand a new application-level halt. For each answer, please specify support status, coverage, exceptions, required permissions/plan, confirmation evidence and official documentation.

**B04: Stop, drain and version transitions**
1. Is there a supported maintenance control that rejects access across the live version, saved older versions, previews, older deployments and direct Worker URLs? Are authenticated/admin or internal paths exempt? How can we inventory executable older endpoints?
2. After new HTTP requests are blocked, what happens to running Workers, external fetches, Queue/Scheduled work and other writers? Is there a supported API or status proving quiescence, with propagation and waiting conditions? Please explain how to handle unknown external outcomes without assuming cancellation.
3. Does the stop remain enforced throughout migrations, deployments, automatic fallback after deployment failure and rollback? Can reactivation of unsafe older versions be prevented?

**Migration and recovery**
4. How can operators inspect hosted migration history/checksums and reconcile the Drizzle journal? What is the SQL/Worker-upload order and transaction scope? How should partial failures or failed deployments be inspected before retry or roll-forward?
5. Which backups, retention periods, restore permissions and maintenance prerequisites are supported by Sites? How should operators reconcile consumed approvals and deleted information if a restore rolls them back?

**Scheduling and monitoring**
6. Is there a supported path for a Worker scheduled handler or Cron equivalent? Please distinguish it from a ChatGPT cloud task. What are pause/resume controls, concurrency and time/invocation limits, operation without extra paid services under the applicable plan, failure notifications, heartbeat monitoring and log retention?

Please explicitly identify unsupported guarantees and suggest supported alternatives if needed. If Site identifiers are necessary, explain why and how to provide them securely. We will not provide tokens, secrets, cookies, user records or database contents.

Thank you.
---

