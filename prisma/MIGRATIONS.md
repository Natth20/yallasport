# Prisma migrations — baseline notes

## Context

The live database was brought to the current schema with `prisma db push` during early development. That synced tables without writing rows into `_prisma_migrations`.

As of 2026-09-11 the schema in `prisma/schema.prisma` already matches the live PostgreSQL database (`prisma migrate diff` produced an empty script). The three files under `prisma/migrations/` describe the incremental changes that are already present on that database:

| Migration | Purpose |
|---|---|
| `20260908200000_i18n_streaming` | News i18n, entity translations, licensed stream assets |
| `20260909150000_match_round` | `Match.round` column |
| `20260910143000_desk_messages` | Desk inbox (`DeskMessage` + enums) |

## What we did (no data loss)

These commands only insert history rows; they do **not** alter tables or delete data:

```bash
pnpm exec prisma migrate resolve --applied 20260908200000_i18n_streaming
pnpm exec prisma migrate resolve --applied 20260909150000_match_round
pnpm exec prisma migrate resolve --applied 20260910143000_desk_messages
pnpm exec prisma migrate status
# → Database schema is up to date!
```

Verify row counts after baselining:

```bash
node scripts/audit-counts.mjs
```

Expected order of magnitude on the current project DB: ~368 teams, ~184 matches, ~109 leagues (plus whatever players/coaches/news/channels exist).

## Going forward

- **Local / CI schema changes:** use `pnpm exec prisma migrate dev --name <change>` (never `db push` for shared environments).
- **Production / preview deploys:** use `pnpm exec prisma migrate deploy`.
- Do not re-run `migrate resolve --applied` unless you are intentionally baselining another environment that already has the same schema via push.

## Fresh empty database

`migrate deploy` alone applies only the three incremental migrations. A brand-new empty Postgres still needs the full base schema first (restore a dump, or generate a one-time baseline from the empty DB). Prefer restoring from a backup of the current DB for staging clones.
