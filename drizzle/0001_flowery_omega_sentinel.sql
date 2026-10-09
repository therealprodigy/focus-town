ALTER TABLE `members` ADD `position` text;--> statement-breakpoint
ALTER TABLE `members` ADD `position_seq` integer DEFAULT 0 NOT NULL;