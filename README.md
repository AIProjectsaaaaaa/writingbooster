# Writing Assessment Platform

IELTS Task 1 and Task 2 assessments with a teacher workspace, timed student writing interface, Supabase submission storage, and a question library from the supplied pretest collection.

## Question collection

The teacher library contains all **41 question pairs / 82 task pages**. There are 33 distinct pairs; eight repeated pairs are kept and labelled to match the source PDF. Original pages and cropped Task 1 charts are retained as high-quality WebP images, with enlargement and full-resolution viewing.

Sign in at `/admin` to search and preview the collection. Choose **Use this pair** to fill an assessment form, or **Import all assessments → Confirm import** to save the collection to your existing Supabase database. Re-importing skips this teacher's existing collection titles. Existing assessments and submissions are preserved. Importing does not create student access codes.

Students enter their name and an assigned access code, answer both tasks, and submit to the teacher. Submitting displays a confirmation rather than a fabricated percentage score; teachers review answers and enter scores in the admin workspace.

## Development

Use Node.js 24 and the package manager specified in `package.json`:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Set your existing Supabase project URL and public key in .env.local.
pnpm dev
```

The app reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the existing `NEXT_PUBLIC_SUPABASE_ANON_KEY`). These are the public project configuration, not a service-role key. Never place service-role keys or teacher passwords in source code.

Use your **existing** Supabase project. It must be active and have the `exams` and `submissions` tables, teacher authentication, database access policies, and the `start_exam` / `submit_exam` RPCs from your assessment deployment. This repository update does not create or alter a live database. Those backend definitions were not included in the supplied source ZIP; contact the existing project administrator if they are missing rather than creating replacement credentials.

## Validation

```sh
pnpm typecheck
pnpm build
pnpm exec next start --hostname 127.0.0.1 --port 3100
```

With the server running, `node tests/question-bank.mjs` checks all 82 source images and the teacher/student flows using a mock Supabase service. The runner requires Playwright and Chromium in your development environment; see [QUESTION-LIBRARY.md](QUESTION-LIBRARY.md) for options. Mock checks do not establish live database persistence or production authorisation.

## Deploy on Vercel

Connect the intended Vercel project to `AIProjectsaaaaaa/writingplatform`, select Next.js with the repository root as the project root, and retain the existing Supabase environment variables. Vercel should install from `pnpm-lock.yaml` and run the build. Publishing a GitHub commit does not change a different Vercel project that is still connected to v0-managed Git.

After deploying, verify teacher sign-in, import the collection from `/admin`, and test a student access code and submission with the existing backend. No new database schema is required by the question library. Do not deploy this server-backed app using GitHub Pages.

## Previous version

The former local-only application is preserved in Git history at commit `c23450a7e1b499059ff0e2c61ec10073cf5708e8`. Its instructions are retained in [docs/legacy-README.md](docs/legacy-README.md). The old `ACCESS_CODES_*` / `ACCESS_TOKEN_SECRET` configuration and pattern-based feedback API are superseded by the assessment backend. Old `/writing` links redirect to the new candidate entrance.
