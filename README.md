# Landing Page Heading Project

## Setup

Copy `.env.example` to `.env.local` and fill in your Supabase values.

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PAYSLIP_BUCKET`

Optional for local migrations:
- `DATABASE_URL` or `SUPABASE_DB_CONNECTION_STRING`

## Local development

Install dependencies:
```bash
pnpm install
```

Run the app locally:
```bash
pnpm run dev
```

Build the app:
```bash
pnpm run build
```

## Database migrations

If you want to run migrations locally, set `DATABASE_URL` or `SUPABASE_DB_CONNECTION_STRING` and then:
```bash
pnpm run migrate
```

This is required before uploading payslips, because the `payslip_requests` table must include the `payslip_url` column.

## Notes

- `.env.local` is ignored by git, so it is safe for local secret values.
- The `utils/supabase/client.ts` file now reads Supabase values from environment variables.
- Use the Supabase SQL editor for direct SQL changes if you prefer not to run local migration scripts.
