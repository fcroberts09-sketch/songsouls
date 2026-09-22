# 0003. Drizzle for typed queries, hand-written SQL for migrations

Status: accepted, 2026-09-22

## Decision
- Migrations are numbered `.sql` files in `apps/api/migrations`, applied in order by a 60-line migrator (`src/db/migrate.ts`) that records versions in `schema_migrations` and takes an advisory lock.
- Drizzle ORM provides typed queries against a TypeScript mirror of the schema (`src/db/schema.ts`).
- An integration test (`schema-drift.test.ts`) fails CI if the mirror and the database disagree in either direction.

## Why
- The observations table is range-partitioned and the rollup is a plpgsql function. Migration generators handle neither well, and generated diffs for partitioned tables are unreadable.
- A founder who is not an engineer can open a `.sql` file and see the schema. That is worth more than generator convenience.
- Drizzle is SQL-first, has no runtime magic, and its `sql` template escapes to raw Postgres when needed, so the ORM never blocks a query we want to write.

## Alternatives considered
- **Prisma**: excellent DX for CRUD, but its schema language cannot express partitioning, its migration engine fights hand edits, and its query engine adds a binary. No.
- **drizzle-kit generate**: fine for normal tables; we would still hand-edit the partition DDL every time. The drift test gives us the safety without the tooling fight.
- **Knex / Kysely**: Kysely is close to Drizzle; Drizzle's schema mirror gives us the drift test for free.

## Consequences
- Adding a column means editing the SQL migration and the TS mirror. The drift test catches forgetting one.
- Money is `numeric(12,2)` and comes back as a string. Never use JavaScript floats for prices.
