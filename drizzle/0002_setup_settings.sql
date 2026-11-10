CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"setup_done_at" timestamp with time zone
);
--> statement-breakpoint
-- An install that already has a trip is past the first run walkthrough.
INSERT INTO "settings" ("id", "setup_done_at") SELECT 1, now() WHERE EXISTS (SELECT 1 FROM "legs");
