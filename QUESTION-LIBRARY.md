# Pretest collection update

This collection was prepared from the project ZIP supplied on October 19, 2026 and has been integrated into the `writingplatform` repository at the user's request. Applying source changes does not deploy a Vercel project or write to your live Supabase database.

## Included

- All 41 Task 1/Task 2 pairs (82 task pages) from `writing pretest collection (1).pdf`.
- 33 distinct pairs. Eight repeated pairs are retained and labelled to preserve the complete source collection.
- Page 43 is a cover/instructions sheet and is excluded from the question bank. Page 14 includes teaching annotations in the original; the typed question omits those annotations.
- Searchable teacher question library, original-page previews, and full-resolution viewing.
- 200 dpi original-page images encoded as high-quality WebP. Task 1 also has a cropped chart view; the full page remains available through Enlarge / Full resolution. Images preserve the supplied scan's detail; rendering does not invent missing detail.
- A one-pair form fill and a bulk assessment import. Imports preserve existing rows; re-importing skips this teacher's existing collection titles. Do not rename imported titles before repeating the bulk import, or the renamed rows cannot be recognised. Do not run concurrent imports from multiple tabs.
- Student display of the original Task 1 chart and an optional reference scan for Task 2. Answers continue to use the existing `submit_exam` RPC and teacher review workflow.

## Use in your existing project

1. Back up your current project, then apply the files from this ZIP in your existing v0/GitHub project. Keep your current Vercel project and its Supabase environment variables. Do not create a new database or replace credentials.
2. Deploy the updated source using your normal Vercel workflow.
3. Sign in to `/admin` with your existing teacher account.
4. Use **Pretest question library → Import all assessments → Confirm import**. Alternatively, choose **Use this pair**, edit the form if needed, and choose **Create assessment**.
5. Issue access codes through your current code-management workflow and test a candidate submission before assigning an assessment. This update does not add a code-management UI or create access codes automatically.

The import uses the existing `exams` columns: `title`, `task1_prompt`, `task2_prompt`, `task1_image_url`, `duration_minutes`, and `created_by`. There is no schema migration. Original-page references are standard Markdown links at the end of each prompt; the updated candidate view recognises these links. Deploy the updated candidate view before importing the collection.

Database row-level security and existing `start_exam` / `submit_exam` RPCs must remain configured in your Supabase project. No service-role key belongs in this browser application. The supplied ZIP contains no database schema or policy definitions, so this update does not claim to verify live teacher authorisation or the backend RPC implementations.

## Local verification

Use the package manager declared by `package.json` and install from the supplied lockfile:

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run build
pnpm exec next dev --hostname 127.0.0.1 --port 3100
```

With the dev server running, `node tests/question-bank.mjs` checks all original images and the browser flows. The runner needs Playwright available in your development environment and Chromium (default `/usr/bin/chromium`; override with `CHROMIUM_PATH`). `TEST_BASE_URL` overrides the server URL. Browser tests intercept the placeholder Supabase host with test-only responses and use no real accounts, credentials, or database writes. Run these mocked checks without production Supabase variables in your local environment. An optional `SCREENSHOT_DIR` saves screenshots outside the source tree.

Production builds validate TypeScript, and `pnpm typecheck` is also available independently. Real Supabase persistence and the public Vercel deployment require a post-deployment check with your existing account.

`public/question-bank/manifest.json` records the source PDF hash, page coverage, and image quality. `lib/question-bank.json` holds the searchable questions and page references. Do not remove the `public/question-bank` directory when deploying: imported assessments reference these files.
