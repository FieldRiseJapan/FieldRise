-- Append-only operational safety. Paused by default; no grant issuance.
CREATE TABLE maintenance_control(id INTEGER PRIMARY KEY CHECK(id=1),paused INTEGER NOT NULL DEFAULT 1 CHECK(paused IN(0,1)),generation INTEGER NOT NULL DEFAULT 1 CHECK(generation>0));
--> statement-breakpoint
INSERT INTO maintenance_control VALUES(1,1,1);
--> statement-breakpoint
CREATE TABLE maintenance_locks(scope TEXT PRIMARY KEY,holder TEXT NOT NULL,fence INTEGER NOT NULL CHECK(fence>0),expires_at INTEGER NOT NULL,cursor TEXT NOT NULL DEFAULT '');
--> statement-breakpoint
CREATE TABLE deletion_tasks(owner TEXT PRIMARY KEY,owner_key TEXT,request_id TEXT NOT NULL UNIQUE,requested_at INTEGER NOT NULL,completed_at INTEGER,state TEXT NOT NULL CHECK(state IN('QUEUED','DELETING','COMPLETE')),needs_review INTEGER NOT NULL CHECK(needs_review IN(0,1)),exception_digest TEXT,cursor TEXT NOT NULL DEFAULT '',last_error TEXT CHECK(last_error IS NULL OR last_error IN('R2','DB','FENCE','BUDGET','KEY_REVIEW')),purge_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX deletion_tasks_due ON deletion_tasks(state,requested_at);
--> statement-breakpoint
CREATE TABLE maintenance_runs(run_id TEXT PRIMARY KEY,started_at INTEGER NOT NULL,heartbeat_at INTEGER NOT NULL,finished_at INTEGER,status TEXT NOT NULL CHECK(status IN('RUNNING','SUCCESS','PARTIAL','FAILED','STOPPED')),category TEXT CHECK(category IS NULL OR category IN('R2','DB','FENCE','BUDGET','PAUSED','KEY_REVIEW')),processed INTEGER NOT NULL DEFAULT 0,failed INTEGER NOT NULL DEFAULT 0,deferred INTEGER NOT NULL DEFAULT 0,query_count INTEGER NOT NULL DEFAULT 0,r2_count INTEGER NOT NULL DEFAULT 0,overdue INTEGER NOT NULL DEFAULT 0,purge_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE safety_exceptions(exception_id TEXT PRIMARY KEY,digest TEXT NOT NULL,created_at INTEGER NOT NULL,review_at INTEGER NOT NULL,purge_at INTEGER NOT NULL,CHECK(review_at<=purge_at));
