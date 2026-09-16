-- Expense attribution + a controlled expense-category vocabulary, and structured
-- age bands on scout_levels (2026-09-16).
--
-- Clears the two schema blockers recorded against Analytics 3.3:
--   1. Expenses could not be attributed below council level — `expenses` had no
--      school/event FK and only a free-text `category`, which fragmented in practice
--      (live data held both 'Camp' and 'Camping', so one kind of spending reported as
--      two). "Which school has the highest expenses" was therefore underivable.
--   2. Scout-level age bands existed only as prose inside `scout_levels.description`
--      ("Ages 10-12"), so promotion-readiness could not be computed without parsing
--      English out of a description string.
--
-- Additive and backward-compatible throughout. Every new column is nullable, the old
-- `expenses.category` text column is deliberately KEPT (see below), and no existing
-- row is deleted. Safe to run against the live database with data in it.

-- ── 1. Controlled expense categories ────────────────────────────────────────
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- ── 2. Expense attribution columns ──────────────────────────────────────────
-- `category` (free text) is intentionally NOT dropped. Existing rows carry their only
-- categorisation in it, and dropping it would discard that history with nothing to
-- replace it — the backfill below can only match values that happen to correspond to a
-- seeded category. The service reads the relation first and falls back to the string.
ALTER TABLE "expenses" ADD COLUMN "category_id" UUID;
ALTER TABLE "expenses" ADD COLUMN "school_id" UUID;
ALTER TABLE "expenses" ADD COLUMN "event_id" UUID;

CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");
CREATE INDEX "expenses_school_id_idx" ON "expenses"("school_id");
CREATE INDEX "expenses_event_id_idx" ON "expenses"("event_id");

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "events"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 3. Seed the starting vocabulary ─────────────────────────────────────────
-- Derived from the categories the council actually used in free text, with the
-- 'Camp'/'Camping' split collapsed into one canonical 'Camp' — that duplication is
-- precisely what this table exists to prevent.
INSERT INTO "expense_categories" ("id", "name", "description", "created_at", "updated_at")
VALUES
    (gen_random_uuid(), 'Camp', 'Camps, provisions and campsite costs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Materials', 'Badges, printing, supplies and equipment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Transport', 'Travel and transport for activities', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Training', 'Leader and scout training costs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'Administrative', 'Council running costs not tied to one activity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- ── 4. Backfill category_id from the existing free text ─────────────────────
-- Case-insensitive, and folds the known 'Camping' -> 'Camp' duplicate. Rows whose text
-- matches nothing keep `category_id` NULL and retain their original string; they are
-- reported under their free-text label rather than being silently recategorised, since
-- guessing what an unrecognised label meant would fabricate data.
UPDATE "expenses" e
SET "category_id" = c."id"
FROM "expense_categories" c
WHERE e."category_id" IS NULL
  AND e."category" IS NOT NULL
  AND LOWER(TRIM(e."category")) IN (LOWER(c."name"), LOWER(c."name") || 'ing');

-- ── 5. Structured scout-level age bands ─────────────────────────────────────
-- Nullable: a level need not be age-bound (adult leaders), and analytics skips those
-- rather than treating a missing bound as 0.
ALTER TABLE "scout_levels" ADD COLUMN "min_age" INTEGER;
ALTER TABLE "scout_levels" ADD COLUMN "max_age" INTEGER;

-- Backfill from the canonical GSP levels. Matched by name rather than parsed out of
-- `description`, so a reworded description can never silently change an age band.
UPDATE "scout_levels" SET "min_age" = 4,  "max_age" = 6  WHERE "name" = 'Twinkler';
UPDATE "scout_levels" SET "min_age" = 7,  "max_age" = 9  WHERE "name" = 'Star Scout';
UPDATE "scout_levels" SET "min_age" = 10, "max_age" = 12 WHERE "name" = 'Junior Girl Scout';
UPDATE "scout_levels" SET "min_age" = 13, "max_age" = 16 WHERE "name" = 'Senior Girl Scout';
UPDATE "scout_levels" SET "min_age" = 17, "max_age" = 19 WHERE "name" = 'Cadet Girl Scout';
