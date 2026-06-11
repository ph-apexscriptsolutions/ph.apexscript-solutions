Migration helper

This repository includes a simple migration helper to add bank fields and the `base_payment_per_60kb` column to `public.worker_profiles`.

How to run (safe, local):

1. Copy `.env.example` to `.env.local` and fill in your Supabase values.

2. Get your Supabase Postgres connection string from the Supabase project Settings → Database → Connection string (the "Connection string (URI)" value).

3. In your shell, set the environment variable and run the migration script. Examples:

- macOS / Linux:

```
export DATABASE_URL="postgres://postgres:YOUR_PASSWORD@db.host.supabase.co:5432/postgres"
npm run migrate
```

- Windows (PowerShell):

```
$env:DATABASE_URL = "postgres://postgres:YOUR_PASSWORD@db.host.supabase.co:5432/postgres"
npm run migrate
```

What it does

- Adds columns: `bank_name`, `account_number`, `account_type`, `routing_number` (if missing)
- Adds column: `base_payment_per_60kb` with default 700 (if missing)
- Backfills existing rows to 700 where `NULL`.

If you'd like, I can run these steps for you if you provide the connection string (not recommended to paste publicly). Alternatively, I can guide you step-by-step while you paste the connection string into your terminal locally.
