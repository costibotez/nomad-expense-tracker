CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text NOT NULL,
	"category" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"leg_id" integer,
	"rate" numeric(20, 8) NOT NULL,
	"amount_eur" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legs" (
	"id" serial PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"flag" text DEFAULT '' NOT NULL,
	"cities" text DEFAULT '' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"currency" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_leg_id_legs_id_fk" FOREIGN KEY ("leg_id") REFERENCES "public"."legs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "expenses_leg_idx" ON "expenses" USING btree ("leg_id");