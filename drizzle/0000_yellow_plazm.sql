CREATE TABLE `request_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiry` ON `request_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`room_id` text NOT NULL,
	`id` text NOT NULL,
	`token_hash` text NOT NULL,
	`name` text NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`room_id`, `id`),
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_token_hash_unique` ON `members` (`token_hash`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`invite_hash` text NOT NULL,
	`host_member_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`kind` text,
	`status` text DEFAULT 'idle' NOT NULL,
	`minutes` integer DEFAULT 0 NOT NULL,
	`end_at` integer,
	`remaining` integer DEFAULT 0 NOT NULL,
	`shared_minutes` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_invite_hash_unique` ON `rooms` (`invite_hash`);--> statement-breakpoint
CREATE INDEX `rooms_expiry` ON `rooms` (`expires_at`);