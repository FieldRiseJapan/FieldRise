-- Additive only. Default stop; no approval is issued by this migration.
CREATE TABLE send_control(environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),app_scope TEXT NOT NULL,halted INTEGER NOT NULL DEFAULT 1 CHECK(halted IN(0,1)),schema_version INTEGER NOT NULL CHECK(schema_version=1),PRIMARY KEY(environment,app_scope));
--> statement-breakpoint
CREATE TABLE send_grants(grant_id TEXT PRIMARY KEY NOT NULL,environment TEXT NOT NULL CHECK(environment='sandbox'),app_scope TEXT NOT NULL,owner_key TEXT NOT NULL,account_key TEXT NOT NULL,key_version INTEGER NOT NULL CHECK(key_version=1),media_sha256 TEXT NOT NULL CHECK(length(media_sha256)=64),approval_ref TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN('AVAILABLE','CONSUMED','REVOKED','EXPIRED','LEGACY_CONSUMED')),issued_at INTEGER NOT NULL,expires_at INTEGER NOT NULL CHECK(expires_at>issued_at),consumed_at INTEGER,CHECK((state IN('CONSUMED','LEGACY_CONSUMED') AND consumed_at IS NOT NULL) OR (state NOT IN('CONSUMED','LEGACY_CONSUMED') AND consumed_at IS NULL)),FOREIGN KEY(environment,app_scope) REFERENCES send_control(environment,app_scope));
--> statement-breakpoint
CREATE INDEX send_grants_owner ON send_grants(environment,app_scope,owner_key,state);
--> statement-breakpoint
CREATE TABLE send_attempts(attempt_id TEXT PRIMARY KEY NOT NULL,grant_id TEXT NOT NULL UNIQUE REFERENCES send_grants(grant_id),environment TEXT NOT NULL CHECK(environment='sandbox'),app_scope TEXT NOT NULL,owner_key TEXT NOT NULL,account_key TEXT NOT NULL,request_key_hash TEXT NOT NULL,payload_hash TEXT NOT NULL,media_sha256 TEXT NOT NULL,state TEXT NOT NULL CHECK(state IN('RESERVED','DISPATCH_STARTED','UNKNOWN','PENDING','DEFINITIVE_REJECT','TERMINAL')),source TEXT NOT NULL CHECK(source IN('NEW','LEGACY_DB')),created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,receipt INTEGER NOT NULL DEFAULT 0 CHECK(receipt IN(0,1)),review_at INTEGER NOT NULL,purge_at INTEGER NOT NULL,CHECK(review_at<=purge_at),UNIQUE(environment,app_scope,owner_key,request_key_hash));
--> statement-breakpoint
CREATE UNIQUE INDEX send_one_unresolved_account ON send_attempts(environment,app_scope,account_key) WHERE state IN('RESERVED','DISPATCH_STARTED','UNKNOWN','PENDING');
--> statement-breakpoint
CREATE INDEX send_attempts_purge ON send_attempts(purge_at,state);
--> statement-breakpoint
CREATE TABLE delete_requests(owner_key TEXT PRIMARY KEY NOT NULL,request_id TEXT UNIQUE NOT NULL,state TEXT NOT NULL CHECK(state IN('QUEUED','DELETING','COMPLETE')),requested_at INTEGER NOT NULL,completed_at INTEGER,purge_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TRIGGER send_grant_no_restore BEFORE UPDATE ON send_grants WHEN OLD.state IN('CONSUMED','LEGACY_CONSUMED','REVOKED','EXPIRED') AND NEW.state<>OLD.state BEGIN SELECT RAISE(ABORT,'SAFETY_STATE_REJECTED'); END;
--> statement-breakpoint
CREATE TRIGGER send_grant_binding_immutable BEFORE UPDATE ON send_grants WHEN NEW.grant_id<>OLD.grant_id OR NEW.environment<>OLD.environment OR NEW.app_scope<>OLD.app_scope OR NEW.owner_key<>OLD.owner_key OR NEW.account_key<>OLD.account_key OR NEW.media_sha256<>OLD.media_sha256 OR NEW.key_version<>OLD.key_version BEGIN SELECT RAISE(ABORT,'SAFETY_STATE_REJECTED'); END;
--> statement-breakpoint
CREATE TRIGGER send_attempt_validate BEFORE INSERT ON send_attempts BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM send_grants g WHERE g.grant_id=NEW.grant_id AND g.environment=NEW.environment AND g.app_scope=NEW.app_scope AND g.owner_key=NEW.owner_key AND g.account_key=NEW.account_key AND g.media_sha256=NEW.media_sha256 AND g.key_version=1 AND ((NEW.source='NEW' AND NEW.state='RESERVED' AND g.state='AVAILABLE' AND g.expires_at>NEW.created_at AND g.issued_at<=NEW.created_at) OR (NEW.source='LEGACY_DB' AND NEW.state='UNKNOWN' AND g.state='LEGACY_CONSUMED'))) THEN RAISE(ABORT,'SAFETY_APPROVAL_REQUIRED') END;
 SELECT CASE WHEN NEW.source='NEW' AND (NOT EXISTS(SELECT 1 FROM send_control WHERE environment=NEW.environment AND app_scope=NEW.app_scope AND halted=0 AND schema_version=1) OR EXISTS(SELECT 1 FROM delete_requests WHERE owner_key=NEW.owner_key AND state IN('QUEUED','DELETING'))) THEN RAISE(ABORT,'SAFETY_STOPPED') END;
END;
--> statement-breakpoint
CREATE TRIGGER send_attempt_consume AFTER INSERT ON send_attempts WHEN NEW.source='NEW' BEGIN UPDATE send_grants SET state='CONSUMED',consumed_at=NEW.created_at WHERE grant_id=NEW.grant_id AND state='AVAILABLE'; END;
--> statement-breakpoint
CREATE TRIGGER send_attempt_no_restore BEFORE UPDATE ON send_attempts WHEN (NEW.state='RESERVED' AND OLD.state<>'RESERVED') OR NEW.grant_id<>OLD.grant_id OR NEW.environment<>OLD.environment OR NEW.app_scope<>OLD.app_scope OR NEW.owner_key<>OLD.owner_key OR NEW.account_key<>OLD.account_key OR NEW.payload_hash<>OLD.payload_hash OR NEW.request_key_hash<>OLD.request_key_hash OR NEW.source<>OLD.source OR NEW.media_sha256<>OLD.media_sha256 BEGIN SELECT RAISE(ABORT,'SAFETY_STATE_REJECTED'); END;
