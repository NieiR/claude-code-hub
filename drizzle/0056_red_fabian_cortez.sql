CREATE TABLE IF NOT EXISTS "provider_group_priorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"group_tag" varchar(50) NOT NULL,
	"priority" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_group_priorities" ADD CONSTRAINT "provider_group_priorities_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_provider_group" ON "provider_group_priorities" USING btree ("provider_id","group_tag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_provider_group_priority_group" ON "provider_group_priorities" USING btree ("group_tag","priority");