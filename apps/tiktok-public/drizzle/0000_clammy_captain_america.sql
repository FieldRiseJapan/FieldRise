CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`size` integer NOT NULL,
	`type` text NOT NULL,
	`ready` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `connections` (
	`owner` text PRIMARY KEY NOT NULL,
	`open_id` text NOT NULL,
	`secret` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`scopes` text NOT NULL,
	`expires` integer NOT NULL,
	`lock` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `connections_open_id_unique` ON `connections` (`open_id`);--> statement-breakpoint
CREATE TABLE `drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`request_key` text NOT NULL,
	`draft_id` text NOT NULL,
	`open_id` text NOT NULL,
	`state` text NOT NULL,
	`publish_id` text,
	`error` text,
	`created` integer NOT NULL,
	`checked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_idempotency` ON `jobs` (`owner`,`request_key`);--> statement-breakpoint
CREATE TABLE `leases` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`asset_id` text NOT NULL,
	`job_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`accepted` integer NOT NULL,
	`deleting` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `states` (
	`hash` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires` integer NOT NULL
);
