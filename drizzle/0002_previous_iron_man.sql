CREATE TABLE `focus_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text,
	`minutes` integer NOT NULL,
	`started_at` integer NOT NULL,
	`due_at` integer,
	`remaining_ms` integer NOT NULL,
	`status` text NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `focus_sessions_due` ON `focus_sessions` (`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`name` text NOT NULL,
	`reported_minutes` integer DEFAULT 0 NOT NULL,
	`reported_streak` integer DEFAULT 0 NOT NULL,
	`upgrades` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_secret_hash_unique` ON `profiles` (`secret_hash`);--> statement-breakpoint
CREATE TABLE `reward_grants` (
	`session_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`minutes` integer NOT NULL,
	`completed_at` integer NOT NULL,
	`coins` integer NOT NULL,
	`xp` integer NOT NULL,
	`energy` integer NOT NULL,
	`acknowledged_at` integer,
	PRIMARY KEY(`session_id`, `profile_id`),
	FOREIGN KEY (`session_id`) REFERENCES `focus_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reward_grants_pending` ON `reward_grants` (`profile_id`,`acknowledged_at`);--> statement-breakpoint
CREATE TABLE `session_participants` (
	`session_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`forfeited` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`session_id`, `profile_id`),
	FOREIGN KEY (`session_id`) REFERENCES `focus_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_participants_profile` ON `session_participants` (`profile_id`);--> statement-breakpoint
CREATE TABLE `social_pairs` (
	`low_profile_id` text NOT NULL,
	`high_profile_id` text NOT NULL,
	`leader_profile_id` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`low_profile_id`, `high_profile_id`),
	FOREIGN KEY (`low_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`high_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`leader_profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `members` ADD `profile_id` text REFERENCES profiles(id);--> statement-breakpoint
ALTER TABLE `members` ADD `ready` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `members_profile_id` ON `members` (`profile_id`);--> statement-breakpoint
ALTER TABLE `rooms` ADD `owner_profile_id` text REFERENCES profiles(id);--> statement-breakpoint
ALTER TABLE `rooms` ADD `active_session_id` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `last_operation_id` text;